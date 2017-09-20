package com.vierve;

import com.github.nkzawa.socketio.client.Socket;

/**
 * Created by kunal on 7/26/17.
 */

public class SocketHandler {
    private static Socket socket;
    private static String url;
    private static String defaultKey;
    private static String userKey;

    public static synchronized Socket getSocket(){
        return socket;
    }

    public static synchronized void setSocket(Socket socket){
        SocketHandler.socket = socket;
    }

    public static synchronized String getURL(){
        return url;
    }

    public static synchronized void setDefaultKey(String u){
        defaultKey = u;
    }

    public static synchronized String getDefaultKey(){
        return defaultKey;
    }

    public static synchronized void setURL(String u){
        url = u;
    }

    public static synchronized void setUserKey(String u){
        userKey = u;
    }

    public static synchronized String getUserKey(){
        return userKey;
    }



}

