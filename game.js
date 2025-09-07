const move_animation_frames = 25

let scores = [0, 0]
let score_highlight = [false, false]
let times_board_position_reached = new Map()

let player_turn = 0
let player_can_win = [true, true]
let flipped = 0
let manual_input = false
let board = new Board()

function newGame() {
	flipped = Math.floor(Math.random() * 2)
	board.reset(flipped)

	player_can_win = [true, true]
	player_turn = Math.floor(Math.random() * 2)
	score_highlight = [false, false]
	times_board_position_reached.clear()

	// start the auto battle
	setTimeout(() => {
		makeMove(player_turn)
	}, 1000)

	manual_input = false
	drawBoard(board)
}

function makeMove(player) {
	manual_input = false

	// check if the game should be declared a draw
	player_can_win[player] = player_can_win[player] && playerCanStillWin(player, board)
	if (!player_can_win[0] && !player_can_win[1]) {
		return false
	}

	let all_moves = getAllPossibleMovesOfPlayer(player, board)

	if (all_moves.length == 0) {
		// no more legal moves available
		// player loses (stalemates are not a thing)
		scores[1 - player] += 1
		score_highlight[1 - player_turn] = true
		return false
	}

	// get the move returned by each bot
	let move = player_turn == 0 ? blackPlayerMove(board, all_moves) : whitePlayerMove(board, all_moves)

	// make sure the returned move is among the legal ones
	let legal_move = move && all_moves.find(m => m.from == move.from && m.to == move.to)

	if (move && legal_move) {
		// play it
		animateMove(move.from, move.to, board, () => {
			// when move animation finishes, it's the other players turn
			player_turn = 1 - player

			// update the map of board positions reached
			let board_hash = board.hash(player_turn)
			times_board_position_reached.set(board_hash, (times_board_position_reached.get(board_hash) || 0) + 1)

			// make the move and check if the game continues
			if (!makeMove(player_turn)) {
				drawBoard(board)
				
				// game over, start new game after a brief pause
				setTimeout(() => {
					newGame()
				}, 5000)
			}
		})
	} else {
		if (move) {
			let from = coords(move.from)
			let to = coords(move.to)
			let piece = board.at(from.x, from.y)
			console.log(piece.color + " " + piece.symbol + " (" + from.x + "," + from.y + ") --> (" + to.x + "," + to.y + ") is not legal")
		}
		manual_input = true
	}

	return true
}

// -------------------------------------------------------------------------------

function* generateMovesOfPlayer(player, board) {
	let currently_in_check = isInCheck(player, board)

	const pieces_locations = []
	for (let x = 1; x <= 9; x++) {
		for (let y = 1; y <= 10; y++) {
			let p = board.at(x, y)
			if (p instanceof Piece && p.color == player) {
				if(p instanceof Chariot || p instanceof Cannon || p instanceof Horse || p instanceof Banner) {
					pieces_locations.unshift({x, y})
				} else {
					pieces_locations.push({x, y})
				}
			}
		}
	}

	for (let {x, y} of pieces_locations) {
		let p = board.at(x, y)
		let move_generator = p.legalMoves(x, y, board)
		let next_move = move_generator.next()
		while (!next_move.done) {
			let dest = next_move.value
			next_move = move_generator.next()

			// disallow board position repetitions unless it is to escape a check
			if (!currently_in_check) {
				// check for the 3x repetition rule
				let new_board = board.afterMove(i(x, y), dest)
				let new_board_hash = new_board.hash(1 - player)
				
				let times_reached = times_board_position_reached.get(new_board_hash) || 0
				if (times_reached >= 2) {
					continue
				}
			}

			yield { from: i(x, y), to: dest }
		}
	}
}
	

function getAllPossibleMovesOfPlayer(player, board) {
	return [...generateMovesOfPlayer(player, board)]
}

// -------------------------------------------------------------------------------

function playerCanStillWin(player, board) {
	for(let x = 1; x <= 9; x++) {
		for(let y = 1; y <= 10; y++) {
			let p = board.at(x, y)
			if (p instanceof Piece && p.color == player) {
				// still has attacking pieces?
				if (p instanceof Chariot || p instanceof Cannon || p instanceof Horse || p instanceof Banner) {
					return true
				}
				// soldiers are not all in the back rank?
				if (p instanceof Soldier && !p.atBackRank(x, y)) {
					return true
				}
			}
		}
	}

	return false
}