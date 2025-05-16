const BLACK_PLAYER_NAME = "Randotron"
const BLACK_MANCHURIAN = false
function blackPlayerMove(board, legal_moves){
	// access the current board like so:
	//
	// 		let p = board.at(x, y)
	//
	// where x is the file from 1 (left) to 9 (right)
	// and y is the rank from 1 (top) to 10 (bottom)
	// the returned value is either "undefined" if the position is empty
	// or instance of the Piece type. To check, do
	// 
	// 		if (p instanceof Piece)
	//
	// you can also check for specific pieces (see rules.js for a list)
	// e.g.
	// 		if (p instanceof General)
	//
	// this function should return either nothing or a move in the form
	// 		{ from: { x: ??. y: ?? }, to: { x: ??, y: ?? } }
	//
	// Each piece can tell you its legal moves given an (x,y) coordinate and
	// the board positions
	// 		let moves_for_p = p.legalMoves(x, y, board)
	//
	// new board positions can be created using this pattern:
	// e.g. moving a piece from (x1,y1) to (x2,y2)
	// 		let test_board = board.afterMove({ from: { x: x1, y: y1 }, to: { x: x2, y: y2 } })
	
	// play a random legal move
	return legal_moves[ Math.floor(Math.random() * legal_moves.length) ]
	
	// return nothing to play manually
}
