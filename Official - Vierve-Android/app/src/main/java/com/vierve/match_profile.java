package com.vierve;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

/**
 * Created by kunal on 8/26/17.
 */

public class match_profile extends Fragment {



    private boolean disable;

    TextView status;
    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {




        return inflater.inflate(R.layout.match_profile,container,false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);


        TextView username = (TextView) view.findViewById(R.id.profile_username);
        TextView type = (TextView) view.findViewById(R.id.profile_type);
        status = (TextView) view.findViewById(R.id.isNear);

        Bundle bundle = getArguments();

        username.setText("@"+bundle.getString("username"));
        type.setText(bundle.getString("type"));
    }

    public void userIsNear(){
        status.setBackgroundColor(getResources().getColor(R.color.good_green));
        status.setText("Near PickUp Location");
        status.setVisibility(View.VISIBLE);
    }

    public void  userIsNotNear(){
        status.setVisibility(View.INVISIBLE);
    }

    public void disconnected(){
        status.setBackgroundColor(getResources().getColor(R.color.error_red));
        status.setText("Disconnected");
        status.setVisibility(View.VISIBLE);
        disable = true;
    }

    public boolean getDisconnected(){
        return disable;
    }

    public void connected(){
        status.setVisibility(View.INVISIBLE);
        disable = false;
    }

    public void userCantGetAnyCloser(){
        status.setBackgroundColor(getResources().getColor(R.color.colorAccent));
        status.setText("Can't Get Coloser");
        status.setVisibility(View.VISIBLE);
    }




}
