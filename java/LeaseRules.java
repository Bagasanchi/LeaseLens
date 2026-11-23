import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

final class LeaseRules {
    static final Set<String> STOP = Set.of("the","landlord","said","that","would","included","rent","was","will","and","for","with","paid","can","tenant","our","гэрээ","түрээс");
    static final List<Pattern> TOPICS = Arrays.stream(new String[]{"heat|utility|utilities|халаалт|дулаан|ашиглалт","deposit|refund|барьцаа|буцаа","pet|animal|амьтан","repair|maintenance|засвар","parking|garage|зогсоол","notice|termination|цуцлах|мэдэгд","rent increase|rent rise|түрээсийн нэмэгдэл"}).map(Pattern::compile).toList();
    static String normalize(String text) {
        return Normalizer.normalize(text.toLowerCase(Locale.ROOT), Normalizer.Form.NFKC).replaceAll("[^\\p{L}\\p{N}]+"," ").strip();
    }
    static List<String> clauses(String text) {
        return Arrays.stream(text.split("(?U)(?<=[.!?])\\s+|[\\r\\n]+")).map(String::strip).filter(s -> !s.isEmpty()).toList();
    }
    static List<String> matches(String promise, String lease) {
        String normalized = normalize(promise);
        var words = new HashSet<>(Arrays.asList(normalized.split(" ")));
        words.removeIf(w -> w.length() < 3 || STOP.contains(w));
        var topics = TOPICS.stream().filter(p -> p.matcher(normalized).find()).toList();
        return clauses(lease).stream().filter(clause -> {
            String s = normalize(clause);
            return topics.stream().anyMatch(p -> p.matcher(s).find()) || Arrays.stream(s.split(" ")).anyMatch(words::contains);
        }).toList();
    }
    static List<String> difference(List<String> first, List<String> second) {
        var counts = new HashMap<String,Integer>();
        for (String s : second) counts.merge(s,1,Integer::sum);
        var result = new ArrayList<String>();
        for (String s : first) {
            int count = counts.getOrDefault(s,0);
            if (count == 0) result.add(s);
            else counts.put(s,count-1);
        }
        return result;
    }
}
