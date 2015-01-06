var maxDepth = 8;
var numberOfColumns = 7;
var numberOfRows = 6;
var numberOfMovesLeft = numberOfColumns * numberOfRows;

function changeDepth() {
    var maxDepthForm = document.getElementById("form");
    maxDepth = maxDepthForm.elements[0].value;
}

var button = document.getElementById("startButton");
button.onclick = function() {
    button.style.visibility = "hidden";
    document.getElementById("busy").style.visibility = "visible"; // works on chrome and safari, not firefox
    setTimeout(runComputer, 0);
    setTimeout(clearBusy, 0);
};

var table = document.getElementsByTagName("table")[0];
if (table != null) {
    for (var i = 0; i < table.rows.length; i++) {
        for (var j = 0; j < table.rows[i].cells.length; j++) {
	    table.rows[i].cells[j].onclick = function() {
		clickedCell(this);		
		button.style.visibility = "hidden";
		document.getElementById("busy").style.visibility = "visible";
		//document.getElementById("connect-four").style.pointerEvents = "none";
	    };
	}
    }
} else {
    console.log("wtf table is null");
}

function clickedCell(cell) {
    var clickedCol = cell.cellIndex;
    var clickedRow = cell.parentNode.rowIndex;

    var columnFull = true;
    for (var row = numberOfRows - 1; row >= 0; row--) {
	if (gameTable[row][clickedCol] === undefined) {
	    clickedRow = row;
	    gameTable[row][clickedCol] = true; // player square is true
	    table.rows[row].cells[clickedCol].style.backgroundColor = "red";
	    numberOfMovesLeft--;
	    columnFull = false;
	    break;
	}
    }

    if (!columnFull) {
	// a legitimate move was made
	if (someoneWon(true, clickedRow, clickedCol)) {
	    // if player won
	    alert("You won.");
	} else if (numberOfMovesLeft === 0) {
	    // no more legitmate moves left
	    alert("No moves left, final result is a draw.");
	} else setTimeout(runComputer, 0); // computer's turn
    } else alert("Column is full, pick another.");
    
    setTimeout(clearBusy, 0); // have to do it this way to clear busy signal, and set it above
}

function clearBusy() {
    document.getElementById("busy").style.visibility = "hidden";
}

function runComputer() {
    // find a computer move
    var compCol = findMove(); // assumed to be a legitimate move
    var compRow = -1;

    // display and save computer move
    for (var row = numberOfRows - 1; row >= 0; row--) {
	if (gameTable[row][compCol] === undefined) {
	    compRow = row;
	    gameTable[row][compCol] = false; // comp square is false
	    table.rows[row].cells[compCol].style.backgroundColor = "black";
	    numberOfMovesLeft--;
	    break;
	}
    }

    displayPlayerMoves();

    // find if computer won
    if (someoneWon(false, compRow, compCol)) alert("Computer won.");
}

function displayPlayerMoves() {
    for (var j = 0; j < numberOfColumns; j++) {
	var i = validMove(j, gameTable, true);
	if (i >= 0) {
	    var value = alphaBeta(i, j, gameTable, numberOfMovesLeft - 1,
				  maxDepth - 1, -Infinity, Infinity, false);
	    gameTable[i][j] = undefined;

	    console.log(j + " " + value);
	}
    }

    console.log("\n");
}

function findMove() {
    // game representation: gameTable
    // true: player square
    // false: computer square
    // undefined: empty square

    var childArray = [];

    for (var j = 0; j < numberOfColumns; j++) {
	var i = validMove(j, gameTable, false);
	if (i >= 0) {
	    var value = alphaBeta(i, j, gameTable, numberOfMovesLeft - 1,
				  maxDepth - 1, -Infinity, Infinity, true);
	    gameTable[i][j] = undefined;

	    childArray.push([value, j]);
	    console.log(j + " " + value);
	}
    }

    childArray.sort(function(a, b) {return a[0]-b[0]});

    console.log("\n");

    for (var i = childArray.length - 1; i > 0; i--)
	if (childArray[i][0] != childArray[0][0]) childArray.pop();

    // bias towards the middle
    var index = Math.floor((childArray.length - 1) / 2);
    return childArray[index][1];
}

function printGameTable(table) {
    for (var i = 0; i < numberOfRows; i++)
	console.log(table[i]);
}

function alphaBeta(previousRow, previousCol, node, movesLeft, depth, alpha,
		   beta, player) {
    var hValue = heuristic(previousRow, previousCol, !player, node, movesLeft);
    if (hValue > 1 || hValue < -1) return hValue;
    if (movesLeft === 0) return 0; // nobody won, draw
    if (depth <= 0) return hValue;
    
    if (player) { // maximizing, player
	// does it matter which child we start with?
	for (var j = 0; j < numberOfColumns; j++) {
	    var i = validMove(j, node, true);
	    if (i >= 0) {
		var returnAlpha = alphaBeta(i, j, node, movesLeft - 1,
					    depth - 1, alpha, beta, false);
		node[i][j] = undefined;
		if (returnAlpha > alpha) alpha = returnAlpha;
		if (beta <= alpha) break;
	    }
	}
	return alpha;
    } else { // minimizing, computer
	for (var j = 0; j < numberOfColumns; j++) {
	    var i = validMove(j, node, false);
	    if (i >= 0) {
		var returnBeta = alphaBeta(i, j, node, movesLeft - 1,
					   depth - 1, alpha, beta, true);
		node[i][j] = undefined;
		if (returnBeta < beta) beta = returnBeta;
		if (beta <= alpha) break;
	    }
	}
	return beta;
    }
}

function heuristic(previousRow, previousCol, previousPlayer, node, movesLeft) {
    // given previous move and current game state, return preference of computer
    if (someoneWon(previousPlayer, previousRow, previousCol)) {
	if (previousPlayer)
	    return 1 + 1 / (numberOfMovesLeft - movesLeft);
	else
	    return -1 - 1 / (numberOfMovesLeft - movesLeft);
    }

    // prefer to block player creation of 3 out of 4 in sequence
    // prefer to make 3 out of 4 in sequence
    // not a very good heuristic
    var playerSequences = 0;
    var computerSequences = 0;
    for (var i = 0; i < numberOfRows; i++) {
	for (var j = 0; j < numberOfColumns; j++) {
	    if (gameTable[i][j] === undefined) {
		if (someoneWon(true, i, j)) {
		    // player has 3/4 sequence
		    playerSequences++;
		}
		if (someoneWon(false, i, j)) {
		    // computer has 3/4 sequence
		    computerSequences++;
		}
	    }
	}
    }

    if (playerSequences !== 0 || computerSequences !== 0) {
	var seqValue = (playerSequences - computerSequences) / (playerSequences + computerSequences);
	if (seqValue > 0) {
	    var val = 0.5 * seqValue + 1 / (numberOfMovesLeft - movesLeft + 1);
	    if (val > 1) console.log("error val greater than 1: " + val);
	    return val;
	} else if (seqValue < 0) {
	    var val = 0.5 * seqValue - 1 / (numberOfMovesLeft - movesLeft + 1);
	    if (val < -1) console.log("error val less than 1: " + val);
	    return val;
	}
    }

    return 0;
}

function validMove(col, node, player) {
    // checks whether col is valid, and returns row or -1
    for (var i = numberOfRows - 1; i >= 0; i--)
	if (node[i][col] === undefined) {
	    node[i][col] = player;
	    return i;
	}

    return -1;
}

// create game representation as 2 dimensional array
var gameTable = new Array(numberOfRows);
for (var i = 0; i < gameTable.length; i++) {
    gameTable[i] = new Array(numberOfColumns);
}

function someoneWon(player, row, col) {
    // check if move is part of a winning combination

    // check north
    var length = 1;
    for (var i = row - 1; i >= 0; i--)
	if (gameTable[i][col] !== player) break; else length++;
    // check south
    for (var i = row + 1; i < numberOfRows; i++)
	if (gameTable[i][col] !== player) break; else length++;
    if (length >= 4) return true;

    // check west
    length = 1;
    for (var j = col - 1; j >= 0; j--)
	if (gameTable[row][j] !== player) break; else length++;
    // check east
    for (var j = col + 1; j < numberOfColumns; j++)
	if (gameTable[row][j] !== player) break; else length++;
    if (length >= 4) return true;

    // check northwest
    length = 1;
    var i = row - 1;
    var j = col - 1;
    while (i >= 0 && j >= 0)
	if (gameTable[i][j] !== player) break; else {i--; j--; length++;}
    // check southeast
    i = row + 1;
    j = col + 1;
    while (i < numberOfRows && j < numberOfColumns)
	if (gameTable[i][j] !== player) break; else {i++; j++; length++;}
    if (length >= 4) return true;

    // check northeast
    length = 1;
    i = row - 1;
    j = col + 1;
    while (i >= 0 && j < numberOfColumns)
	if (gameTable[i][j] !== player) break; else {i--; j++; length++;}
    // check southwest
    i = row + 1;
    j = col - 1;
    while (i < numberOfRows && j >= 0)
	if (gameTable[i][j] !== player) break; else {i++; j--; length++;}
    if (length >= 4) return true;
        
    return false;
}
