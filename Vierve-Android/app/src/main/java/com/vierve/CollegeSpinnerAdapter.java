package com.vierve;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import java.util.ArrayList;

/**
 * Created by kunal on 9/8/17.
 */

public class CollegeSpinnerAdapter extends ArrayAdapter<ArrayList<String>> {

    public CollegeSpinnerAdapter(Context context, ArrayList<ArrayList<String>> hidden_college) {
        super(context, 0, hidden_college);
    }

    @Override
    public View getDropDownView(int position, View convertView, ViewGroup parent) {
        // Get the data item for this position
        ArrayList<String> current_college = getItem(position);
        // Check if an existing view is being reused, otherwise inflate the view
        if (convertView == null) {
            convertView = LayoutInflater.from(getContext()).inflate(R.layout.spinner_object_college_dropdown, parent, false);
        }
        // Lookup view for data population
        TextView college_name = (TextView) convertView.findViewById(R.id.college_name);
        TextView miles_away = (TextView) convertView.findViewById(R.id.miles_away);
        // Populate the data into the template view using the data object
        college_name.setText(current_college.get(1));
        miles_away.setText( String.valueOf(current_college.get(6))+" mi. away" );
        // Return the completed view to render on screen
        return convertView;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        // Get the data item for this position
        ArrayList<String> current_college = getItem(position);
        // Check if an existing view is being reused, otherwise inflate the view
        if (convertView == null) {
            convertView = LayoutInflater.from(getContext()).inflate(R.layout.spinner_object_college_display, parent, false);
        }
        // Lookup view for data population
        TextView college_name = (TextView) convertView.findViewById(R.id.college_name);
        // Populate the data into the template view using the data object
        college_name.setText(current_college.get(1));

        // Return the completed view to render on screen
        return convertView;
    }
}