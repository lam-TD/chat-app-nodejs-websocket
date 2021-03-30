'use strict'
const _CONST = require('../config/constant')
const login_model = require('../models/login_model')
const md5 = require('md5');

var self = module.exports = {
    function_register: (obj) => {
        //insert vao login collection
        const _obj = {
            email: obj.email,
            password: md5(obj.password),
        }
        return true;
    },
    function_login: async (obj) => {
        //login collection
        const _obj = {
            email: obj.email,
            password: md5(obj.password),
        }

        const fs = require('fs');
        let rawdata = fs.readFileSync(__dirname + "/../../db-json/users.json");
        
        let users = JSON.parse(rawdata);
        const result = await users.find(user => user.username == obj.email && user.password == md5(obj.password))
        if(typeof result == "undefined") {
            return false;
        } else {
            return _obj
        }
    },
}