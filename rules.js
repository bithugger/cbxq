function withinBoard(x, y) {
	return x >= 1 && x <= 9 && y >= 1 && y <= 10
}

function addIfWithin(x, y, moves) {
	if (withinBoard(x, y)) {
		moves.push(i(x, y))
	}
}

function i(x, y) {
	return (x - 1) + (y - 1) * 9
}

function coords(i) {
	return {x: (i % 9) + 1, y: Math.floor(i / 9) + 1}
}

const ZOBRIST_TABLE = [
	[], [], [], [], [], [], [], [],
	[], [], [], [], [], [], [], []
]

for (let a = 0; a < ZOBRIST_TABLE.length; a++) {
	for (let b = 0; b < 90; b++) {
		ZOBRIST_TABLE[a][b] = Math.floor(Math.random() * 2**62)
	}
}

class Board {
	constructor() {
		this.spaces = new Array(90)
		this.generals_pos = []
	}

	at(x, y) {
		return this.spaces[i(x, y)]
	}

	reset(flip) {
		this.spaces.fill(undefined)
		this.generals_pos = []
		this.spawnPieces(flip, 0)
		this.spawnPieces(flip, 1)
	}

	afterMove(from, to) {
		let new_board = new Board()
		new_board.spaces = this.spaces.slice()

		new_board.spaces[to] = this.spaces[from]
		new_board.spaces[from] = undefined

		new_board.generals_pos = this.generals_pos.slice()
		for (let c = 0; c < 2; c++) {
			if (from == this.generals_pos[c]) {
				new_board.generals_pos[c] = to
			}
		}
		
		return new_board
	}

	spawnPieces(flip, player) {
		let xor = flip != player
		let y1 = xor ? 10 : 1
		let s = xor ? -1 : 1
		let x1 = xor ? 1 : 9
		
		let manchurian = player == 0 ? BLACK_MANCHURIAN : WHITE_MANCHURIAN

		let side = flip ? 1 - player : player

		let general = new General(player == 0 ? "将" : "帅", side, player)
		this.spaces[i(5, y1)] = general
		this.generals_pos.push(i(5, y1))

		let guard_1 = new Guard(player == 0 ? "士" : "仕", side, player)
		this.spaces[i(4, y1)] = guard_1

		let guard_2 = new Guard(player == 0 ? "士" : "仕", side, player)
		this.spaces[i(6, y1)] = guard_2

		let elephant_1 = new Elephant(player == 0 ? "象" : "相", side, player)
		this.spaces[i(3, y1)] = elephant_1

		let elephant_2 = new Elephant(player == 0 ? "象" : "相", side, player)
		this.spaces[i(7, y1)] = elephant_2

		if (manchurian) {
			let banner = new Banner("旗", side, player)
			this.spaces[i(x1, y1)] = banner
		} else {
			let horse_1 = new Horse("马", side, player)
			this.spaces[i(2, y1)] = horse_1

			let horse_2 = new Horse("马", side, player)
			this.spaces[i(8, y1)] = horse_2

			let chariot_1 = new Chariot("车", side, player)
			this.spaces[i(1, y1)] = chariot_1

			let chariot_2 = new Chariot("车", side, player)
			this.spaces[i(9, y1)] = chariot_2

			let cannon_1 = new Cannon(player == 0 ? "包" : "炮", side, player)
			this.spaces[i(2, y1 + 2 * s)] = cannon_1

			let cannon_2 = new Cannon(player == 0 ? "包" : "炮", side, player)
			this.spaces[i(8, y1 + 2 * s)] = cannon_2
		}
		
		let soldier_1 = new Soldier(player == 0 ? "卒" : "兵", side, player)
		this.spaces[i(1, y1 + 3 * s)] = soldier_1

		let soldier_2 = new Soldier(player == 0 ? "卒" : "兵", side, player)
		this.spaces[i(3, y1 + 3 * s)] = soldier_2

		let soldier_3 = new Soldier(player == 0 ? "卒" : "兵", side, player)
		this.spaces[i(5, y1 + 3 * s)] = soldier_3

		let soldier_4 = new Soldier(player == 0 ? "卒" : "兵", side, player)
		this.spaces[i(7, y1 + 3 * s)] = soldier_4

		let soldier_5 = new Soldier(player == 0 ? "卒" : "兵", side, player)
		this.spaces[i(9, y1 + 3 * s)] = soldier_5
	}

	hash(player_to_move) {
		let hash = player_to_move

		for (let i = 0; i < this.spaces.length; i++) {
			let p = this.spaces[i]
			if (p instanceof Piece) {
				hash ^= ZOBRIST_TABLE[p.hash()][i]
			}
		}

		return hash
	}
}

// ------------------------------------------------------------------------------------

class Piece {
	constructor(sym, s, c) {
		this.symbol = sym
		this.color = c
		this.side = s
	}

	reachableSpaces(x, y, board) {
		return []
	}

	*legalMoves(x, y, board) {
		const pos = i(x, y)
		const dests = this.reachableSpaces(x, y, board)
		for (let dest of dests) {
			if (this.isMoveValid(pos, board, dest)) {
				yield dest
			}
		}
	}

	isMoveValid(pos, board, dest) {
		const p = board.spaces[dest]
		if (p instanceof Piece && p.color == this.color) {
			return false
		}

		// see if this move would put the moving player in check
		const test_board = board.afterMove(pos, dest)

		return !isInCheck(this.color, test_board)
	}

	hash() {
		return this.color
	}
}

// ------------------------------------------------------------------------------------

class Soldier extends Piece {
	reachableSpaces(x, y, board) {
		const moves = []

		if (this.side == 0) {
			addIfWithin(x, y+1, moves)
			if (this.acrossRiver(x, y)) {
				addIfWithin(x-1, y, moves)
				addIfWithin(x+1, y, moves)
			}
		} else {
			addIfWithin(x, y-1, moves)
			if (this.acrossRiver(x, y)) {
				addIfWithin(x-1, y, moves)
				addIfWithin(x+1, y, moves)
			}
		}

		return moves
	}

	acrossRiver(x, y) {
		if (this.side == 0) {
			return y >= 6
		} else {
			return y <= 5
		}
	}

	atBackRank(x, y) {
		if (this.side == 0) {
			return y == 10
		} else {
			return y == 1
		}
	}

	hash() {
		return this.color + 2
	}
}

// ------------------------------------------------------------------------------------

class Guard extends Piece {
	reachableSpaces(x, y, board) {
		const moves = []

		if (this.side == 0) {
			if (y == 1 || y == 3) {
				moves.push(i(5, 2))
			} else if (y == 2) {
				moves.push(i(4, 1))
				moves.push(i(4, 3))
				moves.push(i(6, 1))
				moves.push(i(6, 3))
			}
		} else {
			if (y == 10 || y == 8) {
				moves.push(i(5, 9))
			} else if (y == 9) {
				moves.push(i(4, 10))
				moves.push(i(4, 8))
				moves.push(i(6, 10))
				moves.push(i(6, 8))
			}
		}

		return moves
	}

	hash() {
		return this.color + 4
	}
}

// ------------------------------------------------------------------------------------

class Elephant extends Piece {
	constructor(sym, side, color) {
		super(sym, side, color)

		this.all_spaces = []
		if (this.side == 0) {
			this.all_spaces.push({x: 3, y: 1})
			this.all_spaces.push({x: 7, y: 1})
			this.all_spaces.push({x: 1, y: 3})
			this.all_spaces.push({x: 5, y: 3})
			this.all_spaces.push({x: 9, y: 3})
			this.all_spaces.push({x: 3, y: 5})
			this.all_spaces.push({x: 7, y: 5})
		} else {
			this.all_spaces.push({x: 3, y: 10})
			this.all_spaces.push({x: 7, y: 10})
			this.all_spaces.push({x: 1, y: 8})
			this.all_spaces.push({x: 5, y: 8})
			this.all_spaces.push({x: 9, y: 8})
			this.all_spaces.push({x: 3, y: 6})
			this.all_spaces.push({x: 7, y: 6})
		}
	}

	reachableSpaces(x, y, board) {
		const moves = []

		for (let space of this.all_spaces) {
			if (Math.abs(space.x - x) == 2 && Math.abs(space.y - y) == 2) {
				if (!(board.at((space.x + x) / 2, (space.y + y) / 2) instanceof Piece)) {
					moves.push(i(space.x, space.y))
				}
			}
		}

		return moves
	}

	hash() {
		return this.color + 6
	}
}

// ------------------------------------------------------------------------------------

class Horse extends Piece {
	reachableSpaces(x, y, board) {
		const moves = []

		if (!(board.at(x + 1, y) instanceof Piece)) {
			addIfWithin(x+2, y-1, moves)
			addIfWithin(x+2, y+1, moves)
		}
		if (!(board.at(x - 1, y) instanceof Piece)) {
			addIfWithin(x-2, y-1, moves)
			addIfWithin(x-2, y+1, moves)
		}
		if (!(board.at(x, y + 1) instanceof Piece)) {
			addIfWithin(x-1, y+2, moves)
			addIfWithin(x+1, y+2, moves)
		}
		if (!(board.at(x, y - 1) instanceof Piece)) {
			addIfWithin(x-1, y-2, moves)
			addIfWithin(x+1, y-2, moves)
		}

		return moves
	}

	hash() {
		return this.color + 8
	}
}

// ------------------------------------------------------------------------------------

class Chariot extends Piece {
	reachableSpaces(x, y, board) {
		const moves = []

		for (let xx = x - 1; xx >= 1; xx -= 1) {
			const p = board.at(xx, y)
			moves.push(i(xx, y))
			if (p instanceof Piece) {
				break
			}
		}
		for (let xx = x + 1; xx <= 9; xx += 1) {
			const p = board.at(xx, y)
			moves.push(i(xx, y))
			if (p instanceof Piece) {
				break
			}
		}
		for (let yy = y - 1; yy >= 1; yy -= 1) {
			const p = board.at(x, yy)
			moves.push(i(x, yy))
			if (p instanceof Piece) {
				break
			}
		}
		for (let yy = y + 1; yy <= 10; yy += 1) {
			const p = board.at(x, yy)
			moves.push(i(x, yy))
			if (p instanceof Piece) {
				break
			}
		}

		return moves
	}

	hash() {
		return this.color + 12
	}
}

// ------------------------------------------------------------------------------------

class Cannon extends Piece {
	reachableSpaces(x, y, board) {
		const moves = []

		let hopped = false
		for (let xx = x - 1; xx >= 1; xx -= 1) {
			const p = board.at(xx, y)
			if (!hopped) {
				if (p instanceof Piece) {
					hopped = true
					continue
				}
				moves.push(i(xx, y))
			} else {
				if (p instanceof Piece) {
					moves.push(i(xx, y))
					break
				}
			}
		}

		hopped = false
		for (let xx = x + 1; xx <= 9; xx += 1) {
			const p = board.at(xx, y)
			if (!hopped) {
				if (p instanceof Piece) {
					hopped = true
					continue
				}
				moves.push(i(xx, y))
			} else {
				if (p instanceof Piece) {
					moves.push(i(xx, y))
					break
				}
			}
		}

		hopped = false
		for (let yy = y - 1; yy >= 1; yy -= 1) {
			const p = board.at(x, yy)
			if (!hopped) {
				if (p instanceof Piece) {
					hopped = true
					continue
				}
				moves.push(i(x, yy))
			} else {
				if (p instanceof Piece) {
					moves.push(i(x, yy))
					break
				}
			}
		}

		hopped = false
		for (let yy = y + 1; yy <= 10; yy += 1) {
			const p = board.at(x, yy)
			if (!hopped) {
				if (p instanceof Piece) {
					hopped = true
					continue
				}
				moves.push(i(x, yy))
			} else {
				if (p instanceof Piece) {
					moves.push(i(x, yy))
					break
				}
			}
		}

		return moves
	}

	hash() {
		return this.color + 10
	}
}

// ------------------------------------------------------------------------------------

class General extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		if (x < 6) {
			moves.push(i(x+1, y))
		}
		if (x > 4) {
			moves.push(i(x-1, y))
		}
		if ((this.side == 0 && y < 3) || (this.side == 1 && y < 10)) {
			moves.push(i(x, y+1))
		}
		if ((this.side == 0 && y > 1) || (this.side == 1 && y > 8)) {
			moves.push(i(x, y-1))
		}

		return moves
	}

	hash() {
		return this.color + 14
	}
}

// ------------------------------------------------------------------------------------

class Banner extends Piece {
	reachableSpaces(x, y, board) {
		const moves = []

		let hopped = false
		for (let xx = x - 1; xx >= 1; xx -= 1) {
			const p = board.at(xx, y)
			if (!hopped) {
				moves.push(i(xx, y))
				if (p instanceof Piece) {
					hopped = true
					continue
				}
			} else {
				if (p instanceof Piece) {
					moves.push(i(xx, y))
					break
				}
			}
		}

		hopped = false
		for (let xx = x + 1; xx <= 9; xx += 1) {
			const p = board.at(xx, y)
			if (!hopped) {
				moves.push(i(xx, y))
				if (p instanceof Piece) {
					hopped = true
					continue
				}
			} else {
				if (p instanceof Piece) {
					moves.push(i(xx, y))
					break
				}
			}
		}

		hopped = false
		for (let yy = y - 1; yy >= 1; yy -= 1) {
			const p = board.at(x, yy)
			if (!hopped) {
				moves.push(i(x, yy))
				if (p instanceof Piece) {
					hopped = true
					continue
				}
			} else {
				if (p instanceof Piece) {
					moves.push(i(x, yy))
					break
				}
			}
		}

		hopped = false
		for (let yy = y + 1; yy <= 10; yy += 1) {
			const p = board.at(x, yy)
			if (!hopped) {
				moves.push(i(x, yy))
				if (p instanceof Piece) {
					hopped = true
					continue
				}
			} else {
				if (p instanceof Piece) {
					moves.push(i(x, yy))
					break
				}
			}
		}

		if (!(board.at(x + 1, y) instanceof Piece)) {
			addIfWithin(x+2, y-1, moves)
			addIfWithin(x+2, y+1, moves)
		}
		if (!(board.at(x - 1, y) instanceof Piece)) {
			addIfWithin(x-2, y-1, moves)
			addIfWithin(x-2, y+1, moves)
		}
		if (!(board.at(x, y + 1) instanceof Piece)) {
			addIfWithin(x-1, y+2, moves)
			addIfWithin(x+1, y+2, moves)
		}
		if (!(board.at(x, y - 1) instanceof Piece)) {
			addIfWithin(x-1, y-2, moves)
			addIfWithin(x+1, y-2, moves)
		}

		return moves
	}

	hash() {
		return this.color + 10
	}
}

// ------------------------------------------------------------------------------------

function getAllPiecesGivingCheckTo(player, board) {
	const general_pos = coords(board.generals_pos[player])
	const gx = general_pos.x
	const gy = general_pos.y

	const pieces_giving_check = []
	// see if the other player has any pieces that attack the general
	for (let x = 1; x <= 9; x++) {
		for (let y = 1; y <= 10; y++) {
			const p = board.at(x, y)
			if (p instanceof Piece && p.color != player) {
				if (p instanceof Soldier) {
					if (Math.abs(x - gx) > 1 || Math.abs(y - gy) > 1) {
						continue
					} else if (y == gy && (x == gx + 1 || x == gx - 1)) {
						// check the spaces immediately to the sides of the general
						pieces_giving_check.push(i(x, y))
					} else if (x == gx && (
						// check the spaces immediately in front of the general
						(y == gy - 1 && p.side == 0)
						|| (y == gy + 1 && p.side == 1)
					)) {
						pieces_giving_check.push(i(x, y))
					}
				} else if (p instanceof General) {
					// 飞将 rule
					if (x == gx) {
						let unobstructed = true
						for (let yy = Math.max(y, gy) - 1; yy > Math.min(y, gy); yy--) {
							if (board.at(x, yy) instanceof Piece) {
								unobstructed = false
								break
							}
						}

						if (unobstructed) {
							pieces_giving_check.push(i(x, y))
						}
					}
				} else {
					if (p instanceof Chariot || p instanceof Banner) {
						// check if the general is on the same row or column as the chariot
						// and has unobstructed access to the general
						if (x == gx || y == gy) {
							let unobstructed = true
							if (x == gx) {
								for (let yy = Math.max(y, gy) - 1; yy > Math.min(y, gy); yy--) {
									if (board.at(x, yy) instanceof Piece) {
										unobstructed = false
										break
									}
								}
							} else {
								for (let xx = Math.max(x, gx) - 1; xx > Math.min(x, gx); xx--) {
									if (board.at(xx, y) instanceof Piece) {
										unobstructed = false
										break
									}
								}
							}
	
							if (unobstructed) {
								pieces_giving_check.push(i(x, y))
							}
						}
					} 
					
					if (p instanceof Cannon || p instanceof Banner) {
						// check if the general is on the same row or column as the cannon
						// with exactly one piece between them
						if (x == gx || y == gy) {
							let hopped = false
							if (x == gx) {
								for (let yy = Math.max(y, gy) - 1; yy > Math.min(y, gy); yy--) {
									if (!hopped && board.at(x, yy) instanceof Piece) {
										hopped = true
									} else if (hopped && board.at(x, yy) instanceof Piece) {
										hopped = false
										break
									}
								}
							} else {
								for (let xx = Math.max(x, gx) - 1; xx > Math.min(x, gx); xx--) {
									if (!hopped && board.at(xx, y) instanceof Piece) {
										hopped = true
									} else if (hopped && board.at(xx, y) instanceof Piece) {
										hopped = false
										break
									}
								}
							}
	
							if (hopped) {
								pieces_giving_check.push(i(x, y))
							}
						}
					}

					if (p instanceof Horse || p instanceof Banner) {
						if (Math.abs(x - gx) > 2 || Math.abs(y - gy) > 2) {
							continue
						} else if ((x == gx - 2 && y == gy - 1 && !(board.at(x + 1, y) instanceof Piece))) {
							pieces_giving_check.push(i(x, y))
						} else if ((x == gx + 2 && y == gy - 1 && !(board.at(x - 1, y) instanceof Piece))) {
							pieces_giving_check.push(i(x, y))
						} else if ((x == gx - 2 && y == gy + 1 && !(board.at(x + 1, y) instanceof Piece))) {
							pieces_giving_check.push(i(x, y))
						} else if ((x == gx + 2 && y == gy + 1 && !(board.at(x - 1, y) instanceof Piece))) {
							pieces_giving_check.push(i(x, y))
						} else if ((x == gx - 1 && y == gy - 2 && !(board.at(x, y + 1) instanceof Piece))) {
							pieces_giving_check.push(i(x, y))
						} else if ((x == gx + 1 && y == gy - 2 && !(board.at(x, y + 1) instanceof Piece))) {
							pieces_giving_check.push(i(x, y))
						} else if ((x == gx - 1 && y == gy + 2 && !(board.at(x, y - 1) instanceof Piece))) {
							pieces_giving_check.push(i(x, y))
						} else if ((x == gx + 1 && y == gy + 2 && !(board.at(x, y - 1) instanceof Piece))) {
							pieces_giving_check.push(i(x, y))
						}
					} 
				} 
			}
		}
	}

	return pieces_giving_check
}

function isInCheck(player, board) {
	return getAllPiecesGivingCheckTo(player, board).length > 0
}

function acceptMove(from, to, board) {
	let piece = board.at(from.x, from.y)
	if (piece instanceof Piece) {
		let available_moves = [...piece.legalMoves(from.x, from.y, board)]
		for (let move of available_moves) {
			let am = coords(move)
			if (am.x == to.x && am.y == to.y) {
				return true
			}
		}
	}

	return false
}
