package sat.compiler.java.java;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

@Data
@AllArgsConstructor
public class CompilationError implements Serializable {
    long line;
    long col;
    String file;
    String error;
}