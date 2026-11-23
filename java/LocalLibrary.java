import com.sun.net.httpserver.HttpExchange;
import java.nio.file.*;
import java.util.*;
import java.net.URLDecoder;
import static java.nio.charset.StandardCharsets.UTF_8;

final class LocalLibrary {
    static void handle(HttpExchange x) throws Exception {
        DemoAccounts.Session session;
        synchronized(DemoAccounts.class){session=DemoAccounts.sessions.get(DemoAccounts.token(x));}
        if(session==null || session.until()<=System.currentTimeMillis()){LeaseServer.reply(x,401,"application/json","{}".getBytes(UTF_8));return;}
        Path dir=DemoAccounts.dir.resolve("comparisons").resolve(session.id());
        Files.createDirectories(dir);
        String id=x.getRequestURI().getPath().substring("/library/".length());
        var response="{}";
        String method=x.getRequestMethod();
        if(!method.equals("GET")) ReviewDemo.require(("http://127.0.0.1:"+x.getLocalAddress().getPort()).equals(x.getRequestHeaders().getFirst("Origin")));
        if(id.isEmpty() && method.equals("POST")){
            byte[] bytes=x.getRequestBody().readNBytes(1500001); ReviewDemo.require(bytes.length<=1500000);
            Properties data=new Properties();
            for(String field:new String(bytes,UTF_8).split("&")){
                String[] parts=field.split("=",2);
                if(parts.length==2)data.setProperty(parts[0],URLDecoder.decode(parts[1],UTF_8));
            }
            for(String k:List.of("promise","lease","revised")){
                String value=data.getProperty(k,"");ReviewDemo.require(value.length()<=(k.equals("promise")?1500:50000) && (k.equals("revised")||!value.isBlank()));
            }
            Path tmp=Files.createTempFile(dir,"save",".tmp");
            try{try(var out=Files.newOutputStream(tmp)){data.store(out,null);}Files.move(tmp,dir.resolve(UUID.randomUUID()+".draft"),StandardCopyOption.ATOMIC_MOVE);}
            finally{Files.deleteIfExists(tmp);}
        }else if(id.isEmpty() && method.equals("GET")){
            var rows=new ArrayList<String>();
            try(var files=Files.newDirectoryStream(dir,"*.draft")){
                for(Path f:files){
                    String title=DemoAccounts.read(f).getProperty("promise");
                    rows.add("{\"id\":"+LeaseServer.quote(f.getFileName().toString().substring(0,36))+",\"title\":"+LeaseServer.quote(title.substring(0,Math.min(80,title.length())))+"}");
                }
            }
            response="["+String.join(",",rows)+"]";
        }else{
            Path file=dir.resolve(UUID.fromString(id)+".draft");
            if(!Files.exists(file)){LeaseServer.reply(x,404,"application/json","{}".getBytes(UTF_8));return;}
            if(method.equals("DELETE"))Files.delete(file);
            else{ReviewDemo.require(method.equals("GET"));var p=DemoAccounts.read(file);var fields=new ArrayList<String>();
                for(String k:List.of("promise","lease","revised"))fields.add(LeaseServer.quote(k)+":"+LeaseServer.quote(p.getProperty(k,"")));
                response="{"+String.join(",",fields)+"}";}
        }
        LeaseServer.reply(x,200,"application/json",response.getBytes(UTF_8));
    }
}