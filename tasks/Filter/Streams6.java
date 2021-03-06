package Filter;

import org.junit.Test;
import sat.compiler.java.annotations.Task;

import static org.junit.Assert.*;

import java.util.*;

/**
 * Using streams, find the average of the given list of integers and return this average value. You can assume that
 * all numbers will be integers and rounding/truncation will follow standard Java guidelines.
 */
@Task(name="E2. Filter average")
public abstract class Streams6 {

    @Test
    public void testAverage() {
        assertEquals(5, average(Arrays.asList(4, 5, 6)));
        assertEquals(4, average(Arrays.asList(3, 1, 7, 5)));
        assertEquals(9, average(Arrays.asList(9, 9, 9, 9, 9, 9, 10)));
        assertEquals(28, average(Arrays.asList(-200, 198, -5, 20, 170, -1, 0, 42)));
    }

    public abstract int average(List<Integer> list);
}