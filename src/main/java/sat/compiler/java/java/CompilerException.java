package sat.compiler.java.java;

import lombok.AllArgsConstructor;
import lombok.Getter;

import javax.script.ScriptException;
import javax.tools.Diagnostic;
import javax.tools.JavaFileObject;
import java.util.List;

@AllArgsConstructor
@Getter
public class CompilerException extends Exception {
    private List<Diagnostic<? extends JavaFileObject>> errors;

    @Override
    public String toString() {
        return "CompilerException{" +
                "errors=" + errors +
                '}';
    }
}
