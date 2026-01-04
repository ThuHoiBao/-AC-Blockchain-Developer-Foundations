// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
contract StudentRegistry {

    struct Student {
        string name;
        uint248 age;
        bool isRegistered;
    }
    address public _owner ;
    mapping (address => Student) private _students;
    event StudentRegistered(address student, string name, uint248 age);

    constructor()
    {
     _owner=msg.sender;
    }
    modifier onlyOwner(){
        require(msg.sender==_owner,"you are not the owner");
        _;
    }

    
    function register (string calldata name_ , uint248 age_ ) external onlyOwner {
        _students[msg.sender]=Student({name: name_ , age: age_ , isRegistered : true});
        emit StudentRegistered(msg.sender,name_,age_);
    }

    function getStudent(address user_) external view returns (string memory name_ , uint248 age_ , bool isRegistered_){
        Student memory student_ = _students[user_];
        return  ( student_.name , student_.age , student_.isRegistered);
    }

    function isStudentRegistered (address user_) external view returns (bool) {
        return _students[user_].isRegistered;
    }
}