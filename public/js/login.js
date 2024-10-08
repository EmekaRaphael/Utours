import axios from "axios";
import { showAlert } from "./alert";

export const signup = async (name, email, password, passwordConfirm, role) => {

    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm,
                role
            }
        });

        if(res.data.status === 'success') {
            showAlert('success', 'Signed up successfuly');
            window.setTimeout(() => {
                location.assign('/')
            }, 1500);
        } else {
            return showAlert('error', 'Please provide info on all required fields');
        }

    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const login = async (email, password) => {

    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password
            }
        });

        if(res.data.status === 'success') {
            showAlert('success', 'Logged in successfully');
            window.setTimeout(() => {
                location.assign('/')
            }, 1500);
        } else {
            return showAlert('error', 'Please provide both email and password.');
        }

    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: "GET",
            url: "/api/v1/users/logout",
        });
        
        if(res.data.status === 'success') {
            window.setTimeout(() => {
                location.assign('/login').reload(true)
            }, 2000);
        }
    showAlert('success', 'User Logged out successfully');

    } catch (err) {
        showAlert("error", "Error logging out! Try again");
    }
};
