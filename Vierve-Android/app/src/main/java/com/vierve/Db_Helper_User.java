package com.vierve;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

/**
 * Created by kunal on 8/28/17.
 */

public class Db_Helper_User extends SQLiteOpenHelper{


    private static final int DATABASE_VERSION = 3;

    private static final String TABLE_USER_INFO  = "user_info";
    private static final String COL_USER_ID  = "user_id";
    private static final String COL_USER_NAME  = "user_name";
    private static final String COL_USER_EMAIL  = "user_email";
    private static final String COL_USER_PASSWORD  = "user_password";
    private static final String COL_REMEMBER  = "remember";

    private static final String COLLEGE_CREATE_TABLE =
            "CREATE TABLE " + TABLE_USER_INFO + "(" +
                    COL_USER_ID + " VARCHAR PRIMARY KEY, " +
                    COL_USER_NAME + " VARCHAR," +
                    COL_USER_PASSWORD + " VARCHAR,"+
                    COL_USER_EMAIL + " VARCHAR,"+
                    COL_REMEMBER+" INTEGER);";



    public Db_Helper_User(Context context, SQLiteDatabase.CursorFactory factory) {
        super(context, TABLE_USER_INFO, factory, DATABASE_VERSION);
    }



    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(COLLEGE_CREATE_TABLE);

    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USER_INFO);
        onCreate(db);
    }

    public Boolean getRemember() {
        Boolean result = false;

        SQLiteDatabase db = this.getReadableDatabase();
        String selectQuery = "SELECT * FROM `" + TABLE_USER_INFO+"`";
        Cursor c = db.rawQuery(selectQuery, null);
        c.moveToFirst();
        if(c.getCount() > 0){
            int temp = c.getInt(c.getColumnIndex(COL_REMEMBER));
            if(temp == 1){
                result = true;
            }
            c.close();
        }
        return result;
    }

    public void setRemember(Boolean value){
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        Log.d("KTag","SET Remember "+value);

        if(value == true){
            values.put(COL_REMEMBER, "1");
        }
        else{
            values.put(COL_REMEMBER, "0");
        }

        db.close();
    }


    public JSONObject getInfo() throws JSONException {
        JSONObject obj = new JSONObject();
        SQLiteDatabase db = this.getReadableDatabase();
        String selectQuery = "SELECT * FROM `" + TABLE_USER_INFO+"`";
        Cursor c = db.rawQuery(selectQuery, null);
        c.moveToFirst();
        if(c.getCount() > 0){
            obj.put("user_id",c.getString(c.getColumnIndex(COL_USER_ID)));
            obj.put("user_name",c.getString(c.getColumnIndex(COL_USER_NAME)));
            obj.put("user_password",c.getString(c.getColumnIndex(COL_USER_PASSWORD)));
            obj.put("user_email",c.getString(c.getColumnIndex(COL_USER_EMAIL)));
            obj.put("remember",c.getString(c.getColumnIndex(COL_REMEMBER)));
            c.close();

        }
        Log.d("KTag","OBJ:"+obj.toString());
        return obj;
    }

    public void clearAllTables(){
        SQLiteDatabase db = getWritableDatabase();

        db.execSQL("DELETE FROM "+ TABLE_USER_INFO);
        db.close();
    }

    public void setUserInfo(JSONObject object) throws JSONException {
        clearAllTables();
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        Log.d("KTag","SET USER "+object.toString());

        values.put(COL_USER_ID, object.getString("user_id"));
        values.put(COL_USER_NAME, object.getString("user_name"));
        values.put(COL_USER_EMAIL, object.getString("user_email"));
        values.put(COL_USER_PASSWORD, object.getString("user_password"));
        values.put(COL_REMEMBER, object.getInt("remember"));

        long result = db.insert(TABLE_USER_INFO, null, values);
        Log.d("KTag","Insert Results:"+result);
        getRemember();
        db.close();

    }

}
