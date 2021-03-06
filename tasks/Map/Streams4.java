package Map;

import org.junit.Test;
import sat.compiler.java.annotations.Task;

import static org.junit.Assert.*;

import java.util.*;

/**
 * Convert an array of integers to a list of strings with the first element starting with 'a', the second with 'b'
 * and so on using streams. You can assume an integer array will not be longer than 26. So array {4, 5, 6} will
 * become {"a4", "b5", "c6"} as stored in the returned list.
 */
@Task(name="C3. Map int to string", restricted="numbers[")
public abstract class Streams4 {

    @Test
    public void testConvert1() {
        List<String> result = Arrays.asList("a1", "b2", "c3", "d4", "e5");
        assertTrue(result.equals(convert(new int[] {1, 2, 3, 4, 5})));
    }

    @Test
    public void testConvert2() {
        List<String> result = Arrays.asList("a200", "b102", "c0", "d90");
        assertTrue(result.equals(convert(new int[] {200, 102, 0, 90})));
    }

    public abstract List<String> convert(int[] numbers);
}