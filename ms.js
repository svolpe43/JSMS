
/* Minesweeper */

var idle = 0;
var flagged = 1;
var exposed = 2;

var easy = 1;
var medium = 2;
var hard = 3;

var boardDimWithoutLines = 600;
var lineWidth = 1;
var delta = 1000;
var BOMB_TIME = 0;

var canvas;
var context;
var board;
var cellDim;
var DIM;
var lineOffset;
var boardDimWithLines;
var mouse;
var interval;
var score;
var scorespan;
var secondspan;
var minutespan;
var running;
var difficulty;

// time
var seconds;
var lastblowup;

var bombs = [];
var bombcountspan;
var bombcount;
var flags;

$(document).ready(function(){
	canvas = document.getElementById("discanvas");

	mouse = new Mouse;
	canvas.onmousedown = mouseDown;
	canvas.onmousemove = mouseMove;
	$(document).bind('keyup', 'space', spaceUp);

	bombcountspan = $("#bombcount");
	scorespan = $("#score");
	secondspan = $("#seconds");
	minutespan = $("#minutes")

	context = canvas.getContext("2d");
	context.lineWidth = lineWidth;
	setDifficulty(2);
	reset();
});

// static function to initialize an array
Array.matrix = function(numrows, numcols){
   var arr = [];
   for (var i = 0; i < numrows; ++i){
      var columns = [];
      for (var j = 0; j < numcols; ++j){
         columns[j] = new Tile();
      }
      arr[i] = columns;
    }
    return arr;
}

// mouse object
function Mouse(){
	this.x = 0;
	this.y = 0;
}

function Point(x, y){
	this.x = x;
	this.y = y;
}

// tile object
function Tile(){
	this.isBomb = false;
	this.surrounding = 0;
	this.state = idle;
}

function start(){
	if(!running){
		console.log("Starting...");
		reset(difficulty);
		interval = setInterval(step, delta);
		running = true;
		lastblowup = new Date().getTime();
		seconds = 0;
	}
}

function stop(){
	if(running){
		console.log("Stopping...");
		clearInterval(interval);
		running = false;
	}
}

function step(){
	var currenttime = new Date().getTime();
	if(currenttime > lastblowup + BOMB_TIME){
		blowupbomb();
		lastblowup = new Date().getTime();
	}
	updateTime();
}

function blowupbomb(){
	if(bombcount > -1){
		var rand = Math.floor(Math.random() * bombcount);
		console.log(rand);
		bomb = bombs[rand];
		console.log(bomb);
		for(var i = -1; i < 2; i++){
			for(var j = -1; j < 2; j++){
				if(bomb.x + i < 0 || bomb.y + j < 0 || bomb.x + i > DIM - 1 || bomb.y + j > DIM - 1)
					continue;
				if(board[bomb.x + i][bomb.y + j].state == idle)
					board[bomb.x + i][bomb.y + j].state = exposed;
			}
		}
		flags--;
		bombcount--;
		draw();
	}
}

function updateTime(){
	seconds++;
	secondspan.html("Time: " + seconds + " secs");
}

function setDifficulty(diff){
	difficulty = diff;
	reset();
}

// called to reset everything basically
function reset(){
	switch(difficulty){
		case(easy):
			cellDim = 60;
			density = 8;
			break;
		case(medium):
			cellDim = 40;
			density = 15;
			break;
		case(hard):
			cellDim = 30;
			density = 20;
			break;
	}

	bombcount = 0;
	score = 0;

	updateSettings();
	randomize();
	draw();
}

// update the settings of the game, changed when first loading and changing difficulty
function updateSettings(){
	DIM = boardDimWithoutLines / cellDim;
	lineOffset = (lineWidth * (DIM - 1));
	boardDimWithLines = boardDimWithoutLines + lineOffset;

	canvas.width = canvas.height = boardDimWithLines;
	context.clearRect(0, 0, canvas.width, canvas.height);
}

// randomizes the bombs on the board, this is not how the original does it
// original uses set number of bombs and performs normal distribution
function randomize(){
	board = Array.matrix(DIM, DIM);
	for(var i = 0; i < DIM; i++){
		for(var j = 0; j < DIM; j++){
			if(Math.random() < density/100){
				board[i][j].isBomb = true;
				bombs[bombcount] = new Point(i, j);
				bombcount++;
			}
		}
	}
	bombcountspan.html("Flags left: " + bombcount + "     ");
	countSurroundings();
}

// called when space is unpressed
function spaceUp(event){
	if(running){
		x = getTile(mouse, false);
		y = getTile(mouse, true);
		if(board[x][y].state != exposed || bombcount <= 0){
			if(board[x][y].state == flagged){
				board[x][y].state = idle;
				bombcount++;
			}else{
				board[x][y].state = flagged;
				bombcount--;
			}
		}

		bombcountspan.html(bombcount);
		draw();
	}
}

// called when mouse is moved
function mouseMove(event){
	if(running){
		mouse.x = event.x;
		mouse.y = event.y;
	}
}

// called when mouse is pressed
function mouseDown(event){
	if(running){
		x = getTile(event, false);
		y = getTile(event, true);

		if(board[x][y].state == idle){
			if(board[x][y].isBomb){
				gameover();
			}else{
				exposeTile(x, y);
			}
		}
		draw();
	}
}

// get the specific tile that was clicked
function getTile(event, isX){
	return Math.floor(getCord(event, isX)/(cellDim + lineWidth));
}

// get the 1D cordinate of the event
function getCord(event, isX){
	return (isX) ? 
		event.x - canvas.offsetLeft + $(document).scrollLeft() :
		event.y - canvas.offsetTop + $(document).scrollTop();
}

// recursive function to clear a open region of the board
function exposeTile(x, y){
	board[x][y].state = exposed;
	if(board[x][y].surrounding == 0){
		for(var i = -1; i < 2; i++){
			for(var j = -1; j < 2; j++){
				if(x + i < 0 || y + j < 0 || x + i > DIM - 1 || y + j > DIM - 1)
					continue;
				if(!isBomb(x + i, y + j) && board[x + i][y + j].state == idle)
					exposeTile(x + i, y + j);
			}
		}
	}
	score++;
	scorespan.html("Score: " + score + "     ");
}

// called when game is over, exposes every bomb
function gameover(){
	running = false;
	clearInterval(interval);
	for(var i = 0; i < DIM; i++){
		for(var j = 0; j < DIM; j++){
			if(board[i][j].isBomb)
				board[i][j].state = exposed;
		}
	}
}

// draws everything
function draw(){
	drawLines();
	drawCells();
}

// draws the black lines seperating cells
function drawLines(){
	context.fillStyle="#000000";
	var offset = cellDim + lineWidth;
	var x = 0;
	var y = cellDim + lineWidth/2;

	context.beginPath();

	// horizontal lines - y incrementing x is the same
	for(var i = 0; i < DIM - 1; i++){
		context.moveTo(x, y);
		context.lineTo(x + boardDimWithLines, y);
		context.stroke();
		y += offset;
	}

	x = cellDim + lineWidth/2;;
	y = 0;

	// vertical lines - x incrementing y is the same
	for(var i = 0; i < DIM - 1; i++){
		context.moveTo(x, y);
		context.lineTo(x, y + boardDimWithLines);
		context.stroke();
		x += offset;
	}
}

// draws the cells and any letters inside of the cell
// probably could make this neater with some effort
function drawCells(){
	context.fillStyle="#9FEBC5";
	context.font = "15px Arial";
	context.textAlign = "center";

	var tilestring = "";
	var offset = cellDim + lineWidth;
	var x = 0;
	var y = 0;

	for(var i = 0; i < DIM; i++){
		for(var j = 0; j < DIM; j++){
			context.fillStyle="#9FEBC5";
			context.fillRect(x, y, cellDim, cellDim);
			if(board[i][j].state == exposed){
				context.clearRect(x, y, cellDim, cellDim);
				if(board[i][j].surrounding != 0 && !board[i][j].isBomb){
					context.fillStyle="#000000"; 
					tilestring = board[i][j].surrounding;
				}else if(board[i][j].isBomb){
					context.fillStyle="#ff0000";  
					tilestring = "X";
				}
			}else if(board[i][j].state == flagged){
				context.fillStyle="#000000"; 
				tilestring = "F";
			}
			context.fillText(tilestring, x + cellDim/2, y + cellDim/2 + 6);
			tilestring = "";
			x += offset;
		}
		y += offset;
		x = 0;
	}
}

function countSurroundings(){
	for(var i = 0; i < DIM; i++){
		for(var j = 0; j < DIM; j++){
			processCell(i, j);
		}
	}
}

// sets the surrounding mines count on the tile object
function processCell(x, y){
	var count = 0;
	for(var i = -1; i < 2; i++){
		for(var j = -1; j < 2; j++){
			if(i == 0 && j == 0)
				continue;
			if(isBomb(x + i, y + j))
				count++;
		}
	}
	
	board[x][y].surrounding = count;
}

// returns if the tile is a bomb being careful to not go off the board
function isBomb(x, y){
	if(x < 0 || y < 0 || x > DIM - 1 || y > DIM - 1)
		return false;
	return board[x][y].isBomb;
}
