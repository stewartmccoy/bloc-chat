var blocChat = angular.module("BlocChat", ['firebase', 'ui.router', 'ui.bootstrap', 'ngCookies']);

blocChat.service('CurrentRoom', function() {
    return {
        defaults: { name: 'villains', roomId: '-JxHNGCos3CqOHn6-yoz'}
    }
});

blocChat.config(['$stateProvider', '$locationProvider', function($stateProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $stateProvider
    .state('home', {
        url: '/',
        views: {
            'home': {
                controller: 'Home.controller',
                templateUrl: '/templates/home.html'
            }
        }
    });
}]);

blocChat.run(['$cookies', '$modal', function($cookies, $modal) {

    if (!$cookies.blocChatCurrentUser || $cookies.blocChatCurrentUser === '' ) {
        // Do something to allow users to set their username
        $modal.open({
            backdrop : 'static',
            templateUrl: '/templates/username.html',
            controller: 'SetUsernameInstanceModal.controller'
        });
    }
}]);

blocChat.factory("chatRooms", [
    "$firebaseArray",
    "CurrentRoom",
    function($firebaseArray, CurrentRoom) {
        var roomsUrl = 'https://stewart-bloc-chat.firebaseio.com/rooms';
        var roomsRef = new Firebase(roomsUrl);
        var roomsObject = $firebaseArray(roomsRef);

        function addRoom(room) {
            roomsObject.$add({
                name: room
            });
        }

        function setDefaultRoom(name, roomId){
            var roomUrl = 'https://stewart-bloc-chat.firebaseio.com/messages/' + name;
            var roomRef = new Firebase(roomUrl);
            var roomRef = $firebaseArray(roomRef.orderByChild('roomId').equalTo(roomId));
            return roomRef;
        }

        function getRoom(name, roomId) {
            CurrentRoom.defaults.name = name;
            CurrentRoom.defaults.roomId = roomId;
            var currentRoom = CurrentRoom.defaults.name;
            if (currentRoom != 'citizens') {
                var roomUrl = 'https://stewart-bloc-chat.firebaseio.com/messages/' + currentRoom;
                var roomRef = new Firebase(roomUrl);
                var roomRef = $firebaseArray(roomRef.orderByChild('roomId').equalTo(roomId));
                return roomRef;
            } else {
                var roomUrl = 'https://stewart-bloc-chat.firebaseio.com/messages/' + name;
                var roomRef = new Firebase(roomUrl);
                var roomRef = $firebaseArray(roomRef.orderByChild('roomId').equalTo(roomId));
                return roomRef;
            }
        }

        return {
            rooms: roomsObject,
            add_room: addRoom,
            get_room: getRoom,
            default_room: setDefaultRoom
        };
    }
]);

blocChat.factory('Message', ['$firebaseArray', 'CurrentRoom', '$cookies', function($firebaseArray, CurrentRoom, $cookies) {

    function sendMessage(newMessage){
        var roomId = CurrentRoom.defaults.roomId;
        var currentRoom = CurrentRoom.defaults.name;
        var userName = $cookies.blocChatCurrentUser;

        var messageUrl = 'https://stewart-bloc-chat.firebaseio.com/messages/' + currentRoom;
        var messagesRef = new Firebase(messageUrl);
        var messages = $firebaseArray(messagesRef);

        messages.$add({
            username: userName,
            content: newMessage,
            sentAt: "9:12 PM",
            roomId: roomId
        });
    }

    return {
        send: sendMessage
    }
}]);

blocChat.controller('Home.controller', ['$scope', 'chatRooms', 'Message', function($scope, chatRooms, Message) {
    $scope.rooms = chatRooms.rooms;

    $scope.messages = chatRooms.default_room('villains', '-JxHNGCos3CqOHn6-yoz');
    $scope.roomName = 'villains';

    $scope.getRoom = function(name, $id) {
        $scope.messages = chatRooms.get_room(name, $id);
        $scope.roomName = name;
    };

    $scope.newMessage = {
        contents: ''
    };

    $scope.sendMessage = function () {
        var newMessage = $scope.newMessage.contents;

        Message.send(newMessage);

        $scope.newMessage.contents = '';
    };
}]);

blocChat.controller('AddRoomModal.controller', ['$scope', '$modal', function($scope, $modal) {
    $scope.open = function () {
        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: '/templates/add-room.html',
          controller: 'AddRoomModalInstance.controller'
        });
    };
}]);

blocChat.controller('AddRoomModalInstance.controller', ['$scope', '$modalInstance', 'chatRooms', function($scope, $modalInstance, chatRooms) {
    $scope.newRoomObject = {
        roomTitle: ''
    };

    $scope.addRoom = function () {
        var room = $scope.newRoomObject.roomTitle;

        chatRooms.add_room(room);
    };
}]);

blocChat.controller('SetUsernameInstanceModal.controller', ['$scope', '$modalInstance', '$cookies', function($scope, $modalInstance, $cookies) {
    $scope.setNewUsername = {
        name: ''
    };

    $scope.setUserName = function () {
        var username = $scope.setNewUsername.name;

        if (username !== undefined) {
            username = username.replace(/^\s+/, '').replace(/\s+$/, '');
        }

        if (username === '' || username === undefined) {
            $scope.usernameError = 'Username cannot be empty';
            $scope.usernameErrorTrue = true;
            $scope.setNewUsername.name = '';
            return
        } else {
            $cookies.blocChatCurrentUser = username;
            $modalInstance.dismiss();
        }
    };
}]);
