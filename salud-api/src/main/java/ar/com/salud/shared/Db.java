package ar.com.salud.shared;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** SQL parametrizado. Los nombres de tabla/columna proceden exclusivamente del código. */
@Component
public class Db {
    public final JdbcTemplate jdbc;
    public Db(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public List<Map<String,Object>> list(String sql, Object... args) {
        return jdbc.queryForList(sql, params(args));
    }
    public Map<String,Object> one(String sql, Object... args) {
        var rows = list(sql,args);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Recurso no visible.");
        return rows.getFirst();
    }
    public UUID id(String sql, Object... args) { return jdbc.queryForObject(sql,UUID.class,params(args)); }
    public boolean exists(String sql, Object... args) {
        return Boolean.TRUE.equals(jdbc.queryForObject("select exists("+sql+")",Boolean.class,params(args)));
    }
    public int update(String sql, Object... args) { return jdbc.update(sql,params(args)); }
    public static UUID uuid(Map<String,Object> row,String key) { return (UUID) row.get(key); }
    public static Instant instant(Map<String,Object> row,String key) { return ((Timestamp)row.get(key)).toInstant(); }
    private static Object[] params(Object[] args) {
        return Arrays.stream(args).map(a -> a instanceof Instant i ? Timestamp.from(i) : a).toArray();
    }
}
