package com.mazi.android;

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
 * Created by kunal on 5/13/17.
 */

public class DB_Helper extends SQLiteOpenHelper {

    private static final int DATABASE_VERSION = 16;

    private static final String TABLE_COLLEGE_INFO  = "college_info";
    private static final String COL_COLLEGE_NAME  = "college_name";
    private static final String COL_COLLEGE_ID  = "college_id";
    private static final String COL_COLLEGE_VERSION  = "college_version";
    private static final String COL_COLLEGE_COOR_LAT  = "college_coor_lat";
    private static final String COL_COLLEGE_COOR_LNG  = "college_coor_lng";
    private static final String COLLEGE_CREATE_TABLE =
            "CREATE TABLE " + TABLE_COLLEGE_INFO + "(" +
                    COL_COLLEGE_ID + " INTEGER PRIMARY KEY, " +
                    COL_COLLEGE_NAME + " TEXT," +
                    COL_COLLEGE_VERSION + " DOUBLE," +
                    COL_COLLEGE_COOR_LAT + " DECIMAL(13,10)," +
                    COL_COLLEGE_COOR_LNG + " DECIMAL(13,10)" +
                    " );";

    private static final String TABLE_PARKINGLOT_INFO  = "parkinglot_info";
    private static final String COL_PARKINGLOT_NAME  = "parkinglot_name";
    private static final String COL_PARKINGLOT_ID  = "parkinglot_id";
    private static final String COL_PARKINGLOT_COOR_LAT  = "parkinglot_coor_lat";
    private static final String COL_PARKINGLOT_COOR_LNG  = "parkinglot_coor_lng";
    private static final String PARKINGLOT_CREATE_TABLE =
            "CREATE TABLE " + TABLE_PARKINGLOT_INFO + "(" +
                    COL_PARKINGLOT_ID + " INTEGER PRIMARY KEY, " +
                    COL_COLLEGE_ID + " INTEGER , " +
                    COL_PARKINGLOT_NAME + " TEXT," +
                    COL_PARKINGLOT_COOR_LAT + " DECIMAL(13,10)," +
                    COL_PARKINGLOT_COOR_LNG+ " DECIMAL(13,10)" +
                    " );";

    public DB_Helper(Context context, SQLiteDatabase.CursorFactory factory) {
        super(context, TABLE_COLLEGE_INFO, factory, DATABASE_VERSION);
    }



    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(COLLEGE_CREATE_TABLE);
        db.execSQL(PARKINGLOT_CREATE_TABLE);

    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_COLLEGE_INFO);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_PARKINGLOT_INFO);
        onCreate(db);
    }

    public void clearAllTables(){
        SQLiteDatabase db = getWritableDatabase();

        db.execSQL("DELETE FROM "+ TABLE_COLLEGE_INFO);
        db.execSQL("DELETE FROM "+ TABLE_PARKINGLOT_INFO);
        db.close();
    }

    public void addCollege(int id, JSONObject object) throws JSONException {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();

        values.put(COL_COLLEGE_ID, id);
        values.put(COL_COLLEGE_NAME, object.getString("college_name"));
        values.put(COL_COLLEGE_VERSION, object.getString("college_version"));
        values.put(COL_COLLEGE_COOR_LAT, object.getDouble("college_coor_lat"));
        values.put(COL_COLLEGE_COOR_LNG, object.getDouble("college_coor_lng"));

        db.insert(TABLE_COLLEGE_INFO, null, values);
        Log.d("KTag", "Add College: "+values.toString());
        db.close();
    }

    public ArrayList<ArrayList<String>> getAllCollegesInformation() {
        ArrayList<ArrayList<String>> allColleges = new ArrayList<>();

        SQLiteDatabase db = this.getReadableDatabase();
        String selectQuery = "SELECT * FROM `" + TABLE_COLLEGE_INFO+"`";
        Cursor c = db.rawQuery(selectQuery, null);

        c.moveToFirst();
        while (!c.isAfterLast()) {
            if (c.getString(c.getColumnIndex(COL_COLLEGE_NAME)) != null) {

                ArrayList<String> temp = new ArrayList<>();
                temp.add(c.getString(c.getColumnIndex(COL_COLLEGE_ID)));
                temp.add(c.getString(c.getColumnIndex(COL_COLLEGE_NAME)));
                temp.add(c.getString(c.getColumnIndex(COL_COLLEGE_COOR_LAT)));
                temp.add(c.getString(c.getColumnIndex(COL_COLLEGE_COOR_LNG)));
                allColleges.add(temp);
                c.moveToNext();
            }
        }

        db.close();
        return allColleges;
    }

    public ArrayList<ArrayList<String>> getAllCollegeVersion() {
        ArrayList<ArrayList<String>> allColleges = new ArrayList<>();

        SQLiteDatabase db = this.getReadableDatabase();
        String selectQuery = "SELECT * FROM `" + TABLE_COLLEGE_INFO+"`";
        Cursor c = db.rawQuery(selectQuery, null);

        c.moveToFirst();
        while (!c.isAfterLast()) {
            if (c.getString(c.getColumnIndex(COL_COLLEGE_NAME)) != null) {
                ArrayList<String> temp = new ArrayList<>();
                temp.add(c.getString(c.getColumnIndex(COL_COLLEGE_ID)));
                temp.add(c.getString(c.getColumnIndex(COL_COLLEGE_VERSION)));
                allColleges.add(temp);
                c.moveToNext();
            }
        }
        db.close();
        return allColleges;
    }

    public boolean checkCollege(int id) {
        SQLiteDatabase db = this.getReadableDatabase();
        String Query = "Select * from `" + TABLE_COLLEGE_INFO + "` where `college_id` = " + id;
        Cursor cursor = db.rawQuery(Query, null);
        if(cursor.getCount() <= 0){
            cursor.close();
            return false;
        }
        cursor.close();
        return true;
    }


    public String getCollege(int id) {
        SQLiteDatabase db = this.getReadableDatabase();
        String results = "";
        String Query = "Select * from `" + TABLE_COLLEGE_INFO + "` where `college_id` = " + id;
        Cursor c = db.rawQuery(Query, null);
        if (c.getString(c.getColumnIndex(COL_COLLEGE_NAME)) != null) {



            results = c.getString(c.getColumnIndex(COL_COLLEGE_NAME));


        }
        c.close();
        return results;
    }

    public void addParkingLot(int id, JSONObject object) throws JSONException {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();

        values.put(COL_PARKINGLOT_ID, id);
        values.put(COL_COLLEGE_ID, object.getString("college_id"));
        values.put(COL_PARKINGLOT_NAME, object.getString("parkinglot_name"));
        values.put(COL_PARKINGLOT_COOR_LAT, object.getDouble("coor_lat"));
        values.put(COL_PARKINGLOT_COOR_LNG, object.getDouble("coor_lng"));

        db.insert(TABLE_PARKINGLOT_INFO, null, values);
        Log.d("KTag", "Add ParkingLot: "+values.toString());
        db.close();
    }

    public ArrayList<ArrayList<String>> getAllParkingLotsFromCollege(String id) {

        ArrayList<ArrayList<String>> allParkingLots = new ArrayList<>();

        SQLiteDatabase db = this.getReadableDatabase();
        String selectQuery = "SELECT * FROM `" + TABLE_PARKINGLOT_INFO+"` where `college_id` = " + id;

        Cursor c = db.rawQuery(selectQuery, null);
        c.moveToFirst();

        while (!c.isAfterLast()) {
            if (c.getString(c.getColumnIndex(COL_PARKINGLOT_NAME)) != null) {

                ArrayList<String> temp = new ArrayList<>();
                temp.add(c.getString(c.getColumnIndex(COL_PARKINGLOT_ID)));
                temp.add(c.getString(c.getColumnIndex(COL_PARKINGLOT_NAME)));
                temp.add(c.getString(c.getColumnIndex(COL_PARKINGLOT_COOR_LAT)));
                temp.add(c.getString(c.getColumnIndex(COL_PARKINGLOT_COOR_LNG)));
                allParkingLots.add(temp);
                c.moveToNext();
            }
        }
        db.close();
        return allParkingLots;
    }

    public boolean checkParkingLot(int id) {
        SQLiteDatabase db = this.getReadableDatabase();
        String Query = "Select * from `" + TABLE_PARKINGLOT_INFO + "` where `parkinglot_id` = " + id;
        Cursor cursor = db.rawQuery(Query, null);
        if(cursor.getCount() <= 0){
            cursor.close();
            return false;
        }
        cursor.close();
        return true;
    }



}
