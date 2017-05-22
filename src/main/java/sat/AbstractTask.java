package sat;

import java.util.List;

public abstract class AbstractTask {
    public abstract String getCodeToDisplay();
    public abstract String getMethodsToFill();
    public abstract String[] getTestableMethods();
    public abstract String getName();
    public abstract String getProcessedSource();
}
