package com.vierve;

import com.github.nkzawa.socketio.client.Socket;

/**
 * Created by kunal on 7/26/17.
 */

public class SocketHandler {
    private static Socket socket;

    public static synchronized Socket getSocket(){
        return socket;
    }

    public static synchronized void setSocket(Socket socket){
        SocketHandler.socket = socket;
    }
}

