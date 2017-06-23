package sat.compiler.java.remote;

import lombok.Getter;
import lombok.Setter;
import sat.compiler.java.JavaCompiler;
import sat.util.JSONUtils;
import sat.webserver.CompileRequest;
import sat.webserver.CompileResponse;
import sat.webserver.ProjectRequest;

import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;
import java.util.HashMap;

/**
 * Created by sanjay on 29/05/17.
 */
@Getter
@Setter
public class RemoteTaskInfoImpl extends UnicastRemoteObject implements RemoteTaskInfo {

    private String messageSent;
    private String messageReceived;
    private HashMap<Integer,CompileResponse> remote = new HashMap<>();
    private HashMap<Integer,ProjectRequest> local = new HashMap<>();
    private String compiled;
    public RemoteTaskInfoImpl() throws RemoteException {
        super(0);
        compiled = JSONUtils.toJSON(JavaCompiler.tasks);
    }
    @Override
    public ProjectRequest getMessageFrom(int id) throws RemoteException {
        return local.get(id);
    }

    @Override
    public void setMessageFor(CompileResponse message, int id) throws RemoteException {
        remote.put(id,message);
    }

    @Override
    public String getCompiledTasks() throws RemoteException {
        return compiled;
    }


}
