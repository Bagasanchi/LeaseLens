import com.sun.net.httpserver.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class ReviewDemo {
    static final String ROOT = "/demo";
    record Finding(String text, String decision) {}
    static class Case {
        final String id = UUID.randomUUID().toString();
        final String masked;
        final List<Finding> findings = new ArrayList<>();
        String state = "queued";
        Case(String sample) {
            masked = sample.replaceAll("[А-ЯӨҮ]{2}\\d{8}", "[РЕГИСТР]")
                .replaceAll("\\b\\d{8}\\b", "[УТАС]");
            for (String s : LeaseRules.clauses(masked)) {
                if (s.contains("буцаах хугацаа")) findings.add(new Finding("Барьцааг хэд хоногт буцаахыг тодруулна уу.", "pending"));
                if (s.contains("ашиглалтын")) findings.add(new Finding("Ашиглалтын зардалд ямар төлбөр багтахыг тодруулна уу.", "pending"));
            }
        }
    }
    static class Desk {
        final Map<String,Case> cases = new LinkedHashMap<>();
        boolean lawyer;
    }
    static final Map<String,Desk> sessions = new java.util.concurrent.ConcurrentHashMap<>();
    static final String SAMPLE = "Регистр АБ12345678. Утас 99112233. Барьцааг буцаах хугацаа тодорхойгүй. Түрээслэгч ашиглалтын зардлыг төлнө.";
    static String esc(String s) { return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;"); }
    static String form(String action,String fields,String button) {
        return "<form method=post action='/demo"+action+"'>"+fields+"<button>"+button+"</button></form>";
    }
    static String input(String key,String value) {
        return "<input type=hidden name='"+key+"' value='"+esc(value)+"'>";
    }
    static void require(boolean ok) { if(!ok) throw new IllegalArgumentException(); }
    static void send(HttpExchange x,int code,String html) throws Exception {
        String page = "<!doctype html><html lang=mn><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>LeaseLens · Хяналт</title><style>body{color-scheme:light dark;font:17px/1.5 system-ui;max-width:720px;margin:auto;padding:24px;background:Canvas;color:CanvasText}form,p,article{margin:1em 0}article{border:1px solid #8888;border-radius:12px;padding:16px}label{display:block}textarea{width:95%;padding:8px}button,select{padding:9px;margin:4px}a{color:LinkText}</style><main><a href='/'>LeaseLens</a> · <a href='/demo'>LeaseLens · Курсын демо</a>"+html+"</main></html>";
        x.getResponseHeaders().set("Content-Type","text/html;charset=utf-8");
        x.getResponseHeaders().set("Cache-Control","no-store");
        x.getResponseHeaders().set("Content-Security-Policy","default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
        byte[] bytes=page.getBytes(StandardCharsets.UTF_8);
        x.sendResponseHeaders(code,bytes.length); x.getResponseBody().write(bytes);
    }
    static String report(Case c) {
        StringBuilder b=new StringBuilder("<h2>Батлагдсан тайлан</h2>");
        for(Finding f:c.findings) if(!f.decision.equals("remove")) b.append("<article>").append(esc(f.text)).append("</article>");
        if(c.findings.stream().allMatch(f->f.decision.equals("remove"))) b.append("<p>Хуульч тайланд оруулах дүгнэлт үлдээгээгүй.</p>");
        return b.toString();
    }
    static String view(Desk d) {
        StringBuilder b=new StringBuilder("<h1>"+(d.lawyer?"Хуульчийн дараалал":"Миний гэрээнүүд")+"</h1><p>Зохиомол гэрээтэй дотоод демо. Нэг браузерт хоёр дүрийг туршина.</p>");
        b.append("<a href='/demo/profile'>My profile</a>"); b.append(form("/role","",d.lawyer?"Иргэний дэлгэц":"Хуульчийн дэлгэц"));
        if(!d.lawyer) b.append("<article><h2>Түрээсийн жишээ гэрээ</h2><p>"+SAMPLE+"</p>"+form("/submit",
            "<label><input type=checkbox required name=analysis> Автомат шалгалт хийхийг зөвшөөрөв</label><label><input type=checkbox required name=review> Хуульч далдалсан текстийг харахыг зөвшөөрөв</label><label><input type=checkbox required name=local> Демо өгөгдлийг зөвхөн энэ компьютерт боловсруулахыг ойлгов</label>","Хяналтад илгээх")+"</article>");
        int number=0;
        for(Case c:d.cases.values()) {
            String id=input("id",c.id);
            b.append("<article><h2>Гэрээ №"+(++number)+"</h2><p>"+switch(c.state){case "queued"->"Дараалалд байна";case "review"->"Хуульч хянаж байна";default->"Тайлан бэлэн";}+"</p>");
            if(c.state.equals("done")) b.append("<a href='/demo/report/"+c.id+"'>Тайлан үзэх</a>");
            else if(d.lawyer && c.state.equals("queued")) b.append(form("/claim",id,"Хяналтад авах"));
            else if(d.lawyer) {
                b.append("<blockquote>"+esc(c.masked)+"</blockquote>");
                for(int i=0;i<c.findings.size();i++) {
                    var f=c.findings.get(i);
                    b.append("<form method=post action='/demo/decide'>"+id+input("index",""+i)+"<label>Дүгнэлт<textarea name=text maxlength=1500 required>"+esc(f.text)+"</textarea></label><label>Шийдвэр <select required name=decision>");
                    for(var op:List.of("pending","approve","edit","remove")) b.append("<option "+(op.equals(f.decision)?"selected ":"")+(op.equals("pending")?"disabled ":"")+"value='"+op+"'>"+switch(op){case "pending"->"Сонгох";case "approve"->"Зөвшөөрөх";case "edit"->"Засах";default->"Хасах";}+"</option>");
                    b.append("</select></label><button>Хадгалах</button></form>");
                }
                b.append(form("/add",id+"<label>Шинэ дүгнэлт<textarea required maxlength=1500 name=text></textarea></label>","Нэмэх"));
                if(c.findings.stream().noneMatch(f->f.decision.equals("pending"))) b.append(form("/finish",id,"Баталж илгээх"));
            }
            b.append("</article>");
        }
        return b.toString();
    }
    static void handle(HttpExchange x) throws Exception {
        String path=x.getRequestURI().getPath();
        Desk desk=DemoAccounts.route(x);
        if(desk==null)return;
        synchronized(desk) {
            if(x.getRequestMethod().equals("GET")) {
                if(path.equals(ROOT)||path.equals("/")) {send(x,200,view(desk));return;}
                Case c=path.startsWith("/demo/report/")?desk.cases.get(path.substring(13)):null;
                if(c!=null && c.state.equals("done")) send(x,200,report(c)); else send(x,404,"Тайлан олдсонгүй.");
                return;
            }
            require(x.getRequestMethod().equals("POST"));
            String origin=x.getRequestHeaders().getFirst("Origin");
            require(origin==null || origin.equals("http://127.0.0.1:"+x.getLocalAddress().getPort()));
            byte[] bytes=x.getRequestBody().readNBytes(16001); require(bytes.length<=16000);
            var data=new HashMap<String,String>();
            for(String field:new String(bytes,StandardCharsets.UTF_8).split("&")) {
                var pair=field.split("=",2); if(pair.length==2)data.put(pair[0],URLDecoder.decode(pair[1],StandardCharsets.UTF_8));
            }
            if(path.equals("/demo/role")) desk.lawyer=!desk.lawyer;
            else if(path.equals("/demo/submit")) {
                require(!desk.lawyer && data.keySet().containsAll(List.of("analysis","review","local")));
                var c=new Case(SAMPLE); desk.cases.put(c.id,c);
            } else {
                Case c=desk.cases.get(data.get("id")); require(desk.lawyer && c!=null);
                if(path.equals("/demo/claim")) {require(c.state.equals("queued"));c.state="review";}
                else {
                    require(c.state.equals("review"));
                    String t=data.getOrDefault("text","").strip();
                    switch(path) {
                        case "/demo/decide" -> {
                            int i=Integer.parseInt(data.get("index")); require(i>=0 && i<c.findings.size());
                            String op=data.get("decision");require(Set.of("approve","edit","remove").contains(op));
                            if(op.equals("edit"))require(!t.isEmpty()&&t.length()<=1500);
                            c.findings.set(i,new Finding(op.equals("edit")?t:c.findings.get(i).text,op));
                        }
                        case "/demo/add" -> { require(!t.isEmpty()&&t.length()<=1500);c.findings.add(new Finding(t,"approve")); }
                        case "/demo/finish" -> {require(c.findings.stream().noneMatch(f->f.decision.equals("pending")));c.state="done";}
                        default -> throw new IllegalArgumentException();
                    }
                }
            }
            x.getResponseHeaders().set("Location",ROOT); x.sendResponseHeaders(303,-1);
        }
    }
    public static void main(String[] args) throws Exception {
        HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",args.length==0?8790:Integer.parseInt(args[0])),0);
        server.createContext("/",x->{try{handle(x);}catch(Exception e){try{send(x,400,"Үйлдлийг гүйцэтгэх боломжгүй.");}catch(Exception ignored){}}finally{x.close();}});
        server.start();
    }
}