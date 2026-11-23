import com.sun.net.httpserver.HttpExchange;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.net.URLDecoder;
import java.util.*;

final class DemoAccounts {
    static final Path dir = Path.of(System.getProperty("leaselens.accounts",
        Path.of(System.getenv("LOCALAPPDATA"),"LeaseLens","profiles").toString()));
    static final Map<String,Session> sessions = new HashMap<>();
    static final Map<String,ReviewDemo.Desk> desks = new HashMap<>();
    record Session(String id,long until) {}
    static String token(HttpExchange x) {
        for(String c : Objects.toString(x.getRequestHeaders().getFirst("Cookie"),"").split("; *"))
            if(c.startsWith("llaccount=")) return c.substring(10);
        return "";
    }
    static byte[] hash(String password,byte[] salt) throws Exception {
        var spec = new PBEKeySpec(password.toCharArray(),salt,600000,256);
        try {return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();}
        finally {spec.clearPassword();}
    }
    static Properties read(Path file) throws Exception {
        Properties p=new Properties(); try(var in=Files.newInputStream(file)){p.load(in);} return p;
    }
    static void save(String id,Properties p) throws Exception {
        Path tmp=Files.createTempFile(dir,"profile",".tmp");
        try {try(var out=Files.newOutputStream(tmp)){p.store(out,null);}
            Files.move(tmp,dir.resolve(id+".properties"),StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);
        } finally {Files.deleteIfExists(tmp);}
    }
    static String field(String title,String name,String type,String value,String autocomplete) {
        return "<label>"+title+" <input required name='"+name+"' type='"+type+"' autocomplete='"+autocomplete+"' value='"+ReviewDemo.esc(value)+"'></label>";
    }
    static String screen(boolean register) {
        String fields=register?field("Email (Gmail supported)","email","email","","email")+field("Username","username","text","","username")+field("Nickname","nickname","text","","nickname"):field("Username or email","login","text","","username");
        fields+=field(register?"Password (12 or more characters)":"Password","password","password","",register?"new-password":"current-password");
        return "<h1>"+(register?"Create account":"Sign in")+"</h1>"+ReviewDemo.form(register?"/register":"/login",fields,register?"Create account":"Sign in")+"<a href='/demo/"+(register?"login'>Sign in":"register'>Create account")+"</a>";
    }
    static Map<String,String> form(HttpExchange x) throws Exception {
        String origin=x.getRequestHeaders().getFirst("Origin");
        ReviewDemo.require(origin==null || origin.equals("http://127.0.0.1:"+x.getLocalAddress().getPort()));
        byte[] bytes=x.getRequestBody().readNBytes(8193);ReviewDemo.require(bytes.length<=8192);
        Map<String,String> data=new HashMap<>();
        for(String f:new String(bytes,StandardCharsets.UTF_8).split("&")){
            var a=f.split("=",2);if(a.length==2)data.put(a[0],URLDecoder.decode(a[1],StandardCharsets.UTF_8));
        }return data;
    }
    static void redirect(HttpExchange x) throws Exception {
        x.getResponseHeaders().set("Location","/demo");x.sendResponseHeaders(303,-1);
    }
    static synchronized ReviewDemo.Desk route(HttpExchange x) throws Exception {
        String path=x.getRequestURI().getPath();
        boolean post=x.getRequestMethod().equals("POST");
        sessions.values().removeIf(s->s.until()<System.currentTimeMillis());
        Session session=sessions.get(token(x));
        boolean register=path.equals("/demo/register");
        if(register || path.equals("/demo/login")) {
            if(!post){ReviewDemo.send(x,200,screen(register));return null;}
            var f=form(x);String password=f.getOrDefault("password","");
            Files.createDirectories(dir);
            String email=f.getOrDefault("email","").strip().toLowerCase(Locale.ROOT);
            String user=f.getOrDefault("username","").strip();
            String nick=f.getOrDefault("nickname","").strip();
            String login=f.getOrDefault("login","").strip();
            if(password.length()>256 || (register && (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")||email.length()>254||!user.matches("[A-Za-z0-9_]{3,32}")||nick.isBlank()||nick.length()>60||password.length()<12))){
                ReviewDemo.send(x,400,"<p>Use a valid email, a 3–32 character username (letters, digits, underscore), a nickname up to 60 characters and a 12–256 character password.</p>"+screen(register));return null;
            }
            String id=null;
            try(var files=Files.newDirectoryStream(dir,"*.properties")){
                for(Path file:files){var p=read(file);
                    if(register && (email.equalsIgnoreCase(p.getProperty("email"))||user.equalsIgnoreCase(p.getProperty("username")))){
                        ReviewDemo.send(x,409,"<p>Email or username already registered.</p>"+screen(true));return null;}
                    if(!register && (login.equalsIgnoreCase(p.getProperty("email"))||login.equalsIgnoreCase(p.getProperty("username")))){
                        var decoder=Base64.getDecoder();
                        if(MessageDigest.isEqual(decoder.decode(p.getProperty("hash")),hash(password,decoder.decode(p.getProperty("salt")))))id=p.getProperty("id");
                        break;
                    }
                }
            }
            if(register){id=UUID.randomUUID().toString();var p=new Properties();byte[] salt=new byte[16];new SecureRandom().nextBytes(salt);
                p.setProperty("id",id);p.setProperty("email",email);p.setProperty("username",user);p.setProperty("nickname",nick);
                p.setProperty("salt",Base64.getEncoder().encodeToString(salt));p.setProperty("hash",Base64.getEncoder().encodeToString(hash(password,salt)));save(id,p);}
            if(id==null){ReviewDemo.send(x,401,"<p>Incorrect login or password.</p>"+screen(false));return null;}
            sessions.remove(token(x));String fresh=UUID.randomUUID().toString();sessions.put(fresh,new Session(id,System.currentTimeMillis()+604800000L));
            x.getResponseHeaders().add("Set-Cookie","llaccount="+fresh+"; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800");redirect(x);return null;
        }
        if(session==null){ReviewDemo.send(x,post?401:200,screen(false));return null;}
        if(path.equals("/demo/logout") && post){form(x);sessions.remove(token(x));x.getResponseHeaders().add("Set-Cookie","llaccount=; Path=/; Max-Age=0; SameSite=Strict; HttpOnly");redirect(x);return null;}
        if(path.equals("/demo/profile")){
            var p=read(dir.resolve(session.id()+".properties"));
            if(post){String nick=form(x).getOrDefault("nickname","").strip();ReviewDemo.require(!nick.isBlank()&&nick.length()<=60);p.setProperty("nickname",nick);save(session.id(),p);redirect(x);return null;}
            ReviewDemo.send(x,200,"<h1>My profile</h1><p>"+ReviewDemo.esc(p.getProperty("username"))+" · "+ReviewDemo.esc(p.getProperty("email"))+"</p>"+ReviewDemo.form("/profile",field("Nickname","nickname","text",p.getProperty("nickname"),"nickname"),"Save profile")+ReviewDemo.form("/logout","","Sign out"));return null;
        }
        return desks.computeIfAbsent(session.id(),key->new ReviewDemo.Desk());
    }
}