
/* Minesweeper */

var idle = 0;
var flagged = 1;
var exposed = 2;

var easy = 1;
var medium = 2;
var hard = 3;

var boardDimWithoutLines = 600;
var lineWidth = 1;

var canvas;
var context;
var board;
var cellDim;
var DIM;
var lineOffset;
var boardDimWithLines;
var mouse;
var bombcount;
var bombcountspan;

$(document).ready(function(){
	canvas = document.getElementById("discanvas");

	mouse = new Mouse;
	canvas.onmousedown = mouseDown;
	canvas.onmousemove = mouseMove;
	$(document).bind('keyup', 'space', spaceUp);

	bombcountspan = $("#bombcount");

	context = canvas.getContext("2d");
	context.lineWidth = lineWidth;
	reset(2);
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

// tile object
function Tile(){
	this.isBomb = false;
	this.surrounding = 0;
	this.state = idle;
}

// called to reset everything basically
function reset(difficulty){
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
	bombcount = 0;
	for(var i = 0; i < DIM; i++){
		for(var j = 0; j < DIM; j++){
			if(Math.random() < density/100){
				board[i][j].isBomb = true;
				bombcount++;
			}
		}
	}
	bombcountspan.html("Bombs left: " + bombcount);
	countSurroundings();
}

// called when space is unpressed
function spaceUp(event){
	x = getTile(mouse, false);
	y = getTile(mouse, true);
	if(board[x][y].state != exposed){
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

// called when mouse is moved
function mouseMove(event){
	mouse.x = event.x;
	mouse.y = event.y;
}

// called when mouse is pressed
function mouseDown(event){
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
}

// called when game is over, exposes every bomb
function gameover(){
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
