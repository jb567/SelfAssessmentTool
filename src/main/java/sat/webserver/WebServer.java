package sat.webserver;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.commons.io.FilenameUtils;
import org.junit.runner.notification.RunNotifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import sat.autocompletion.AutoCompletion;
import sat.autocompletion.Autocompletor;
import sat.compiler.TaskCompiler;
import sat.compiler.java.CompilerException;
import sat.compiler.task.TaskInfo;
import sat.compiler.task.TaskNameInfo;
import sat.util.JSONUtils;
import spark.Spark;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.ServerSocket;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.fusesource.jansi.Ansi.ansi;
import static spark.Spark.get;
import static spark.Spark.post;


public class WebServer {
    //TODO: We should add a button for copying the ace editorQ
    //TODO: should we read this from a config file?
    private static final int port = 4567;
    private Logger logger = LoggerFactory.getLogger(WebServer.class);
    private static AtomicBoolean isCompiling = new AtomicBoolean();
    public void startServer() {
        logger.info(""+ansi().render("@|green Starting Web Server|@"));
        if (checkPortInUse()) return;
        Spark.staticFileLocation("site");
        Spark.port(port);
        get("/listTasks", (req, res) -> JSONUtils.toJSON(listTasks()));
        post("/testCode", (req, res) -> {
            while (isCompiling.get()) Thread.sleep(500);
            isCompiling.set(true);
            TaskRequest request = JSONUtils.fromJSON(req.body(),TaskRequest.class);
            String json = JSONUtils.toJSON(TaskCompiler.compile(request));
            isCompiling.set(false);
            return json;
        });
        post("/autocomplete", (req, res) -> {
            TaskRequest request = JSONUtils.fromJSON(req.body(),TaskRequest.class);
            return JSONUtils.toJSON(Autocompletor.getCompletions(request));
        });
        logger.info(""+ansi().render("@|green Starting Socket.IO Server|@"));
        //Compile all the current tasks so that we don't have to do it on the first connection.
        listTasks();
    }

    /**
     * Check if the server is already running / needs to be stopped.
     * @return true if in use, false if not
     */
    private boolean checkPortInUse() {
        try {
            new ServerSocket(port).close();
            return false;
        } catch (IOException e) {
            logger.error(""+ansi().render("@|red Port "+port+" is already in use. Unable to start WebServer.|@"));
            logger.info(""+ansi().render("@|yellow Type exit to close the program.|@"));
            return true;
        }
    }

    /**
     * Compile all tasks in the tasks folder and generate a TaskNameInfo for them
     * @return a list of tasks
     */
    private List<TaskNameInfo> listTasks() {
        List<TaskNameInfo> navs = new ArrayList<>();
        for (File task : new File("tasks").listFiles()) {
            try {
                String name = FilenameUtils.getBaseName(task.getName());
                if (!task.getName().endsWith(".java")) continue;;
                TaskInfo taskInfo = TaskCompiler.getTaskInfo(name,new FileInputStream(task));
                navs.add(new TaskNameInfo(name, taskInfo.getName()));
            } catch (IllegalAccessException | InstantiationException | IOException | ClassNotFoundException e) {
                e.printStackTrace();
            } catch (CompilerException e) {
                System.out.println(e.getErrors());
            }
        }
        navs.sort(Comparator.comparing(TaskNameInfo::getFullName));
        return navs;
    }
}
