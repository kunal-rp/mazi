package com.vierve;

import android.util.Log;

/**
 * Created by kunal on 10/3/17.
 */

public class MyLogger {

    private static final boolean LOGGING = false; //false to disable logging

    public static void d(String tag, String message) {
        if (LOGGING) {
            Log.d(tag, message);
        }
    }

}
