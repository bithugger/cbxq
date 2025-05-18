const WHITE_PLAYER_NAME = "Cowardotron"
const WHITE_MANCHURIAN = false

function absolutePieceValue(p) {
	switch (true) {
		case p instanceof Soldier: return 1;
		case p instanceof Guard: return 2;
		case p instanceof Elephant: return 3;
		case p instanceof Horse: return 5;
		case p instanceof Cannon: return 5;
		case p instanceof Chariot: return 10;
		case p instanceof General: return 10000;
		default: return 0;
	}
}

function mobilityMultiplier(p) {
	switch (true) {
		case p instanceof Chariot: return 1.1;
		case p instanceof Cannon: return 1.2;
		default: return 1;
	}
}

function positionMultiplier(p, x, y) {
	const march = 1 + ((this.side === 0 ? y : 10 - y) / 10)

	switch (true) {
		case p instanceof Soldier: march * 2;
		case p instanceof Chariot: march * 1.1;
		case p instanceof Horse: march * 1.2;
		case p instanceof Cannon: return x >= 4 && x <= 6 ? 1.3 : 1;
		default: return 1;
	}
}

function calculateBoardValue(board) {
	let value = [0, 0]
	for(let x = 1; x <= 9; x++) {
		for(let y = 1; y <= 10; y++) {
			const piece = board.at(x, y)
			if (piece instanceof Piece) {
				value[piece.color] += absolutePieceValue(piece) * positionMultiplier(piece,x,y)
				
				const legalMoves = [...piece.legalMoves(x, y, board)]
				value[piece.color] += legalMoves.length * mobilityMultiplier(piece)	
				
				for (const move of legalMoves) {
					const dest = coords(move)
					const target = board.at(dest.x, dest.y)
					if (target instanceof Piece && target.color === 1) {
						value[piece.color] += absolutePieceValue(target) * 500
					}
					if (target instanceof General && target.color === 0) {
						value[piece.color] *= 1.01
					}
				}
			}
		}
	}
	
	return value[1] - value[0]
}

function whitePlayerMove(board, legal_moves){
	let bestMove = legal_moves[0]
	let bestScore = -Infinity
	
	for (const move of legal_moves) {
		const resultingBoard = board.afterMove(move.from, move.to)
		const resultingScore = calculateBoardValue(resultingBoard)
		if (resultingScore > bestScore) {
			bestMove = move
			bestScore = resultingScore
		}
	}
	
	return bestMove
}
