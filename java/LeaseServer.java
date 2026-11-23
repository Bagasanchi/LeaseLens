import com.sun.net.httpserver.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.Executors;

public class LeaseServer {
    static final HttpClient client = HttpClient.newHttpClient();
    static final String project = System.getenv("SUPABASE_URL");
    static final String key = System.getenv("SUPABASE_PUBLISHABLE_KEY");
    static final int LIMIT = 1500000;
    static final java.nio.charset.Charset UTF8 = StandardCharsets.UTF_8;
    static String quote(String s) {
        StringBuilder out = new StringBuilder("\"");
        for(char c : s.toCharArray()) {
            if(c == '"' || c == '\\') out.append('\\').append(c);
            else if(c < 32) out.append(String.format("\\u%04x",(int)c));
            else out.append(c);
        }
        return out.append('"').toString();
    }
    static String array(List<String> items) {
        return items.stream().map(LeaseServer::quote).collect(java.util.stream.Collectors.joining(",","[","]"));
    }
    static void reply(HttpExchange x,int status,String type,byte[] bytes) throws java.io.IOException {
        x.getResponseHeaders().set("Content-Type",type);
        x.getResponseHeaders().set("Cache-Control","no-store");
        x.getResponseHeaders().set("X-Content-Type-Options","nosniff");
        x.sendResponseHeaders(status,bytes.length == 0 ? -1 : bytes.length);
        if(bytes.length > 0) x.getResponseBody().write(bytes);
    }
    static void handle(HttpExchange x) throws Exception {
        String path = x.getRequestURI().getPath(), method = x.getRequestMethod();
        if(path.startsWith("/demo")) { ReviewDemo.handle(x); return; }
        if(path.startsWith("/library/")) { LocalLibrary.handle(x); return; }
        if(method.equals("GET") && (path.equals("/") || path.equals("/supabase.js"))) {
            String file = path.equals("/") ? "index.html" : "supabase.js";
            reply(x,200,path.equals("/")?"text/html;charset=utf-8":"application/javascript",Files.readAllBytes(Path.of("java-output",file))); return;
        }
        byte[] body = x.getRequestBody().readNBytes(LIMIT+1);
        if(body.length > LIMIT) { reply(x,413,"text/plain",new byte[0]); return; }
        if(path.equals("/api/rules") && method.equals("POST")) {
            var values = new HashMap<String,String>();
            for(String part : new String(body,UTF8).split("&")) {
                var pair = part.split("=",2);
                if(pair.length == 2) values.put(pair[0],URLDecoder.decode(pair[1],UTF8));
            }
            String lease = values.getOrDefault("lease",""), promise = values.getOrDefault("promise",""), revised = values.getOrDefault("revised","");
            if(lease.length()>50000 || revised.length()>50000 || promise.length()>1500) throw new IllegalArgumentException();
            var matches = LeaseRules.matches(promise,lease);
            var a = LeaseRules.clauses(lease); var b = LeaseRules.clauses(revised);
            String json = "{\"matches\":"+array(matches)+",\"added\":"+array(LeaseRules.difference(b,a))+",\"removed\":"+array(LeaseRules.difference(a,b))+",\"sameOrder\":"+a.equals(b)+"}";
            reply(x,200,"application/json",json.getBytes(UTF8)); return;
        }
        if(path.matches("/records/lease_(comparisons|purchases)") && Set.of("GET","POST","DELETE").contains(method)) {
            String token = x.getRequestHeaders().getFirst("Authorization");
            if(token == null || !token.startsWith("Bearer ")) { reply(x,401,"application/json","{}".getBytes(UTF8)); return; }
            String query = x.getRequestURI().getRawQuery();
            var request = HttpRequest.newBuilder(URI.create(project+"/rest/v1/"+path.substring(9)+(query==null?"":"?"+query)))
                .timeout(java.time.Duration.ofSeconds(15)).header("apikey",key).header("Authorization",token);
            for(String header : List.of("Accept","Content-Type","Prefer","Range","Range-Unit")) {
                String val = x.getRequestHeaders().getFirst(header);
                if(val != null) request.header(header,val);
            }
            var response = client.send(request.method(method,HttpRequest.BodyPublishers.ofByteArray(body)).build(),HttpResponse.BodyHandlers.ofByteArray());
            reply(x,response.statusCode(),"application/json",response.body()); return;
        }
        reply(x,404,"text/plain",new byte[0]);
    }
    public static void main(String[] args) throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1",args.length==0?8080:Integer.parseInt(args[0])),0);
        server.createContext("/",x -> {
            try { handle(x); } catch(Exception e) { reply(x,e instanceof IllegalArgumentException?400:502,"text/plain",new byte[0]); }
            finally { x.close(); }
        });
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor()); server.start();
    }
}
