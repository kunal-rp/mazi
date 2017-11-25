package com.vierve;

import android.animation.ArgbEvaluator;
import android.animation.ObjectAnimator;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.location.Location;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ImageButton;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.BufferUnderflowException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;

import static android.graphics.Paint.ANTI_ALIAS_FLAG;


public class college_fragment extends Fragment {


    private DB_Helper_Data db_helper_data;

    //List used to store the college id, lat, lng
    private ArrayList<ArrayList<String>>hidden_college;

    //arrays for spinner info ; element match the hidden list
    public ArrayList<String> face_college = new ArrayList<>();

    private Spinner mCollegeSpinner;

    //holds the college id,lat,lng of the current college id
    public String selected;
    public float lat;
    public float lng;
    private double current_lat, current_lng;
    private TextView event;
    private JSONObject eventData;


    OnHeadlineSelectedListener mCallback;

    // Container Activity must implement this interface
    public interface OnHeadlineSelectedListener {
        public void onCollegeSpinnerItemSelected(float lat, float lng,float ride_limit, float park_limit, String college_id);
        public void onPRActionRequest(String type);
        public void focusCurrentPosition();
    }




    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        // This makes sure that the container activity has implemented
        // the callback interface. If not, it throws an exception
        try {
            mCallback = (OnHeadlineSelectedListener) activity;
        } catch (ClassCastException e) {
            throw new ClassCastException(activity.toString()
                    + " must implement OnHeadlineSelectedListener");
        }
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        face_college = new ArrayList<>();
        hidden_college = new ArrayList<ArrayList<String>>();

       return inflater.inflate(R.layout.fragment_college, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);


        event = (TextView) view.findViewById(R.id.college_event);
        event.setVisibility(View.INVISIBLE);

        event.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(event.getVisibility() == View.VISIBLE){
                    try {
                        JSONObject obj = (JSONObject) eventData.get(selected);
                        Intent intent = new Intent(getContext(), EventDetails.class);
                        intent.putExtra("html",  obj.get("event_html").toString());

                        startActivity(intent);

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                }
            }
        });



        //Sets floating buttons
        FloatingActionButton fab = (FloatingActionButton) view.findViewById(R.id.requestRideButton);
        fab.setImageBitmap(textAsBitmap("RIDE", 40, Color.WHITE ));

        FloatingActionButton fab2 = (FloatingActionButton) view.findViewById(R.id.requestParkingButton);
        fab2.setImageBitmap(textAsBitmap("PARK", 40, Color.WHITE ));

        ImageButton cp = (ImageButton) view.findViewById(R.id.currentPosition);
        cp.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCallback.focusCurrentPosition();
            }
        });

        //setup for the two spinners for college and parking lot selection
        mCollegeSpinner = (Spinner) view.findViewById(R.id.collegeMenu);

        Bundle bundle = getArguments();
        current_lat = bundle.getDouble("current_lat");
        current_lng = bundle.getDouble("current_lng");
        try {
            eventData = new JSONObject(bundle.getString("json"));
        } catch (JSONException e) {
            e.printStackTrace();
        }


        mCollegeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                selected = hidden_college.get(i).get(0);//id
                lat = Float.parseFloat(hidden_college.get(i).get(2));//lat
                lng = Float.parseFloat(hidden_college.get(i).get(3));//lng
                Float ride_limit = Float.parseFloat(hidden_college.get(i).get(4));//ride_limit
                Float park_limit = Float.parseFloat(hidden_college.get(i).get(5));//park_limit
                mCallback.onCollegeSpinnerItemSelected(lat,lng,ride_limit,park_limit, hidden_college.get(i).get(0));

                updateEvent();


            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCallback.onPRActionRequest("ride");

            }
        });
        fab2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCallback.onPRActionRequest("park");
            }
        });

        new college_fragment.GetAllCollegeToSpinner().execute();

    }

    @Override
    public void onDetach() {
        super.onDetach();
        MyLogger.d("KTag","College Fragment Detach");
        mCallback = null;

    }

    private void PopulateSpinner(Spinner spinner, ArrayList<ArrayList<String>> list) {
        CollegeSpinnerAdapter collegeSpinnerAdapter = new CollegeSpinnerAdapter(getContext(),hidden_college);
        spinner.setAdapter(collegeSpinnerAdapter);
    }



    /*
    Method used to put text in the floating buttons
     */
    public static Bitmap textAsBitmap(String text, float textSize, int textColor) {
        Paint paint = new Paint(ANTI_ALIAS_FLAG);
        paint.setTextSize(textSize);
        paint.setColor(textColor);
        paint.setTextAlign(Paint.Align.LEFT);
        float baseline = -paint.ascent(); // ascent() is negative
        int width = (int) (paint.measureText(text) + 0.0f); // round
        int height = (int) (baseline + paint.descent() + 0.0f);
        Bitmap image = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

        Canvas canvas = new Canvas(image);
        canvas.drawText(text, 0, baseline, paint);
        return image;
    }

    /*
    Updates the college spinner with data from the local db
     */

    private class GetAllCollegeToSpinner extends AsyncTask<Object, Object, Void>{


        @Override
        protected Void doInBackground(Object... params) {
            db_helper_data = new DB_Helper_Data(getActivity(), null);

            MyLogger.d("KTag","Location CF:"+current_lat + ","+current_lng);
            ArrayList<ArrayList<String>> temp= db_helper_data.getAllCollegesInformation();
            for(int i = 0; i < temp.size(); i++){
                ArrayList<String> temp2 = new ArrayList<>();
                temp2.add (temp.get(i).get(0));//id
                temp2.add (temp.get(i).get(1));//name
                temp2.add (temp.get(i).get(2));//lat
                temp2.
                        add (temp.get(i).get(3));//lng
                temp2.add (temp.get(i).get(4));//ride_limit
                temp2.add (temp.get(i).get(5));//park_limit

                Location college = new Location("college");
                college.setLatitude(Double.parseDouble(temp.get(i).get(2)));
                college.setLongitude(Double.parseDouble(temp.get(i).get(3)));
                Location user_location = new Location("user");
                user_location.setLatitude(current_lat);
                user_location.setLongitude(current_lng);
                temp2.add((college.distanceTo(user_location)/1609.34 <= 50)?String.format("%.2f",(college.distanceTo(user_location)/1609.34)):"+50");



                hidden_college.add(temp2);//id,lat,lng
            }
            Collections.sort(hidden_college, new Comparator<ArrayList<String>>() {
                @Override
                public int compare(ArrayList<String> o1, ArrayList<String> o2) {
                    float one = Float.parseFloat(o1.get(6));
                    float two = Float.parseFloat(o2.get(6));
                    if (one > two)
                        return 1;
                    if (one < two)
                        return -1;
                    return 0;
                }


            });
            return null;
        }
        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);

            PopulateSpinner(mCollegeSpinner,hidden_college);

        }
    }

    public void updateEvent()  {
        try {

            event.setVisibility(View.VISIBLE);
            JSONObject selected_event = (JSONObject) eventData.get(selected);
            event.setText(selected_event.getString("event_title"));
            // Animation
            Animation animBlink = AnimationUtils.loadAnimation(getContext(),
                    R.anim.blink);

            event.setAnimation(animBlink);

        } catch (JSONException e) {
            e.printStackTrace();
            event.setVisibility(View.INVISIBLE);
            event.clearAnimation();
        }
    }



}
