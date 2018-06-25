var socket = new io();
var player;
var currentTrack;

var historyContainer;
var likesContainer;

var nextTrackButton = document.getElementById("next_video");
var forwardButton = document.getElementById("forward");
var likeButton = document.getElementById("like");

likesContainer = document.getElementById("likes");
historyContainer = document.getElementById("history");

var videoHistory = [];
var likes = [];

function onYouTubeIframeAPIReady() {
  player = new YT.Player('video', {
    width: '640',
    height: '390',
    videoId: currentTrack && currentTrack.videoId,
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}


function setYoutubeVideo(track) {
  currentTrack = track;
  if (player) {
    addToHistory(currentTrack);
    player.loadVideoById(track.videoId);
  }
}

// autoplay video
function onPlayerReady(event) {
  event.target.playVideo();
}

// when video ends
function onPlayerStateChange(event) {
  if (event.data === 0) {
    socket.emit("set next");
  }
}

function addToHistory(track, save) {
  save = save === undefined ? true : save;
  for (var i = 0; i < videoHistory.length; ++i) {
    if (videoHistory[i].videoId === track.videoId) {
      return;
    }
  }

  videoHistory.push(track);

  var intId = setInterval( function() {
    if ( [ 1, 2, 5 ].indexOf( player.getPlayerState() ) >= 0 ) {
      if (player.getVideoData().title) {
        track.title = player.getVideoData().title;
        save && socket.emit("save history", track);
        clearInterval(intId);
        insertHistory(track);
      }
    }
  }, 100 );
}

function insertHistory(track) {
  var id = videoHistory.length;
  var row = document.createElement("div");
  row.innerHTML = "<span>#" + id+ "</span> <a target='_blank' href=\"https://www.youtube.com/watch?v="
    + track.videoId + "\">" + (track.title) + "</a>";
  historyContainer.insertBefore(row, historyContainer.childNodes[0]);
}

function addToLike(track, save) {
  save = save === undefined ? true : save;
  for (var i = 0; i < likes.length; ++i) {
    if (likes[i].videoId === track.videoId) {
      return;
    }
  }

  likes.push(track);
  var id = likes.length;

  var intId = setInterval( function() {
    if ( [ 1, 2, 5 ].indexOf( player.getPlayerState() ) >= 0 ) {
      if (player.getVideoData().title) {
        track.title = player.getVideoData().title;
        save && socket.emit("save like", track);
        clearInterval(intId);
        insertLike(track);
      }
    }
  }, 100 );
}

function insertLike(track) {
  var id = likes.length;
  var row = document.createElement("div");
  row.innerHTML = "<span>#" + id+ "</span> <a target='_blank' href=\"https://www.youtube.com/watch?v="
    + track.videoId + "\">" + (track.title) + "</a>";
  likesContainer.insertBefore(row, likesContainer.childNodes[0]);
}

function forward() {
  if (player) {
    player.seekTo(player.getCurrentTime() + 20);
  }
}

socket.on("set next", function (track) {
  setYoutubeVideo(track);
});
socket.on("forward", function () {
  forward();
});
socket.on("like", function () {
  addToLike(currentTrack);
});

socket.on("likes", (likesArr) => {
  likesArr.forEach((like) => likes.push(like) && insertLike(like));
});
socket.on("history", (history) => {
  history.forEach((history) => videoHistory.push(history) && insertHistory(history));
});

nextTrackButton.addEventListener("click", function (event) {
  socket.emit("set next");
});

forwardButton.addEventListener("click", function (event) {
  forward();
});

likeButton.addEventListener("click", function (event) {
  addToLike(currentTrack);
});