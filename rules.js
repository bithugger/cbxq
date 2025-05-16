function i(x, y) {
	return (x - 1) + (y - 1) * 9
}

class Board {
	constructor() {
		this.spaces = new Array(90)
	}

	at(x, y) {
		return this.spaces[i(x, y)]
	}

	reset(flip) {
		this.spaces.fill(undefined)
		this.spawnPieces(flip, 0)
		this.spawnPieces(flip, 1)
	}

	afterMove(move) {
		let new_board = new Board()
		new_board.spaces = this.spaces.slice()

		new_board.spaces[i(move.to.x, move.to.y)] = this.at(move.from.x, move.from.y)
		new_board.spaces[i(move.from.x, move.from.y)] = undefined
		
		return new_board
	}

	spawnPieces(flip, player) {
		let xor = (flip > 0) != (player > 0)
		let y1 = xor ? 10 : 1
		let s = xor ? -1 : 1
		let x1 = xor ? 1 : 9
		
		let manchurian = player == 0 ? BLACK_MANCHURIAN : WHITE_MANCHURIAN

		let side = flip ? 1 - player : player

		let general = new General(player == 0 ? "将" : "帅", side, player, 5, y1)
		this.spaces[i(5, y1)] = general

		let guard_1 = new Guard(player == 0 ? "士" : "仕", side, player, 4, y1)
		this.spaces[i(4, y1)] = guard_1

		let guard_2 = new Guard(player == 0 ? "士" : "仕", side, player, 6, y1)
		this.spaces[i(6, y1)] = guard_2

		let elephant_1 = new Elephant(player == 0 ? "象" : "相", side, player, 3, y1)
		this.spaces[i(3, y1)] = elephant_1

		let elephant_2 = new Elephant(player == 0 ? "象" : "相", side, player, 7, y1)
		this.spaces[i(7, y1)] = elephant_2

		if (manchurian) {
			let banner = new Banner("旗", side, player, x1, y1)
			this.spaces[i(x1, y1)] = banner
		} else {
			let horse_1 = new Horse("马", side, player, 2, y1)
			this.spaces[i(2, y1)] = horse_1

			let horse_2 = new Horse("马", side, player, 8, y1)
			this.spaces[i(8, y1)] = horse_2

			let chariot_1 = new Chariot("车", side, player, 1, y1)
			this.spaces[i(1, y1)] = chariot_1

			let chariot_2 = new Chariot("车", side, player, 9, y1)
			this.spaces[i(9, y1)] = chariot_2

			let cannon_1 = new Cannon(player == 0 ? "包" : "炮", side, player, 2, y1 + 2 * s)
			this.spaces[i(2, y1 + 2 * s)] = cannon_1

			let cannon_2 = new Cannon(player == 0 ? "包" : "炮", side, player, 8, y1 + 2 * s)
			this.spaces[i(8, y1 + 2 * s)] = cannon_2
		}
		
		let soldier_1 = new Soldier(player == 0 ? "卒" : "兵", side, player, 1, y1 + 3 * s)
		this.spaces[i(1, y1 + 3 * s)] = soldier_1

		let soldier_2 = new Soldier(player == 0 ? "卒" : "兵", side, player, 3, y1 + 3 * s)
		this.spaces[i(3, y1 + 3 * s)] = soldier_2

		let soldier_3 = new Soldier(player == 0 ? "卒" : "兵", side, player, 5, y1 + 3 * s)
		this.spaces[i(5, y1 + 3 * s)] = soldier_3

		let soldier_4 = new Soldier(player == 0 ? "卒" : "兵", side, player, 7, y1 + 3 * s)
		this.spaces[i(7, y1 + 3 * s)] = soldier_4

		let soldier_5 = new Soldier(player == 0 ? "卒" : "兵", side, player, 9, y1 + 3 * s)
		this.spaces[i(9, y1 + 3 * s)] = soldier_5
	}

	hash() {
		let hash = ""
		for (let x = 1; x <= 9; x++) {
			for (let y = 1; y <= 10; y++) {
				let p = this.at(x, y)
				if (p instanceof Soldier) hash += (p.color == 0 ? "s" : "S")
				else if (p instanceof Guard) hash += (p.color == 0 ? "g" : "G")
				else if (p instanceof Elephant) hash += (p.color == 0 ? "e" : "E")
				else if (p instanceof Horse) hash += (p.color == 0 ? "h" : "H")
				else if (p instanceof Chariot) hash += (p.color == 0 ? "r" : "R")
				else if (p instanceof Cannon) hash += (p.color == 0 ? "c" : "C")
				else if (p instanceof General) hash += (p.color == 0 ? "k" : "K")
				else if (p instanceof Banner) hash += (p.color == 0 ? "b" : "B")
				else hash += "."
			}
			hash += "\n"
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
		let moves = this.reachableSpaces(x, y, board)
		for (let move of moves) {
			if (this.isMoveValid(x, y, board, move)) {
				yield move
			}
		}
	}
	isMoveValid(x, y, board, move) {
		if (move.x < 1 || move.x > 9 || move.y < 1 || move.y > 10) {
			return false
		}

		let p = board.at(move.x, move.y)
		if (p instanceof Piece && p.color == this.color) {
			return false
		}

		// see if this move would put the moving player in check
		let test_board = board.afterMove({ from: { x: x, y: y }, to: move })

		let opponents_checkers = getPiecesGivingCheckTo(this.color, test_board)

		return opponents_checkers.length == 0
	}
}

// ------------------------------------------------------------------------------------

class Soldier extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		if (this.side == 0) {
			moves.push({ x: x, y: y + 1 })
			if (this.acrossRiver(x, y)) {
				moves.push({ x: x - 1, y: y })
				moves.push({ x: x + 1, y: y })
			}
		} else {
			moves.push({ x: x, y: y - 1 })
			if (this.acrossRiver(x, y)) {
				moves.push({ x: x - 1, y: y })
				moves.push({ x: x + 1, y: y })
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
}

// ------------------------------------------------------------------------------------

class Guard extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		if (this.side == 0) {
			if (y == 1 || y == 3) {
				moves.push({ x: 5, y: 2 })
			} else if (y == 2) {
				moves.push({ x: 4, y: 1 })
				moves.push({ x: 4, y: 3 })
				moves.push({ x: 6, y: 1 })
				moves.push({ x: 6, y: 3 })
			}
		} else {
			if (y == 10 || y == 8) {
				moves.push({ x: 5, y: 9 })
			} else if (y == 9) {
				moves.push({ x: 4, y: 10 })
				moves.push({ x: 4, y: 8 })
				moves.push({ x: 6, y: 10 })
				moves.push({ x: 6, y: 8 })
			}
		}

		return moves
	}
}

// ------------------------------------------------------------------------------------

class Elephant extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		if (!(board.at(x + 1, y + 1) instanceof Piece)) {
			if (this.side == 1 || y + 2 <= 5) {
				moves.push({ x: x + 2, y: y + 2 })
			}
		}
		if (!(board.at(x - 1, y + 1) instanceof Piece)) {
			if (this.side == 1 || y + 2 <= 5) {
				moves.push({ x: x - 2, y: y + 2 })
			}
		}
		if (!(board.at(x + 1, y - 1) instanceof Piece)) {
			if (this.side == 0 || y - 2 >= 6) {
				moves.push({ x: x + 2, y: y - 2 })
			}
		}
		if (!(board.at(x - 1, y - 1) instanceof Piece)) {
			if (this.side == 0 || y - 2 >= 6) {
				moves.push({ x: x - 2, y: y - 2 })
			}
		}

		return moves
	}
}

// ------------------------------------------------------------------------------------

class Horse extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		if (!(board.at(x + 1, y) instanceof Piece)) {
			moves.push({ x: x + 2, y: y - 1 })
			moves.push({ x: x + 2, y: y + 1 })
		}
		if (!(board.at(x - 1, y) instanceof Piece)) {
			moves.push({ x: x - 2, y: y - 1 })
			moves.push({ x: x - 2, y: y + 1 })
		}
		if (!(board.at(x, y + 1) instanceof Piece)) {
			moves.push({ x: x - 1, y: y + 2 })
			moves.push({ x: x + 1, y: y + 2 })
		}
		if (!(board.at(x, y - 1) instanceof Piece)) {
			moves.push({ x: x - 1, y: y - 2 })
			moves.push({ x: x + 1, y: y - 2 })
		}

		return moves
	}
}

// ------------------------------------------------------------------------------------

class Chariot extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		for (let xx = x - 1; xx >= 1; xx -= 1) {
			let p = board.at(xx, y)
			moves.push({ x: xx, y: y })
			if (p instanceof Piece) {
				break
			}
		}
		for (let xx = x + 1; xx <= 9; xx += 1) {
			let p = board.at(xx, y)
			moves.push({ x: xx, y: y })
			if (p instanceof Piece) {
				break
			}
		}
		for (let yy = y - 1; yy >= 1; yy -= 1) {
			let p = board.at(x, yy)
			moves.push({ x: x, y: yy })
			if (p instanceof Piece) {
				break
			}
		}
		for (let yy = y + 1; yy <= 10; yy += 1) {
			let p = board.at(x, yy)
			moves.push({ x: x, y: yy })
			if (p instanceof Piece) {
				break
			}
		}

		return moves
	}
}

// ------------------------------------------------------------------------------------

class Cannon extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		let hopped = false
		for (let xx = x - 1; xx >= 1; xx -= 1) {
			let p = board.at(xx, y)
			if (!hopped) {
				if (p instanceof Piece) {
					hopped = true
					continue
				}
				moves.push({ x: xx, y: y })
			} else {
				if (p instanceof Piece) {
					moves.push({ x: xx, y: y })
					break
				}
			}
		}

		hopped = false
		for (let xx = x + 1; xx <= 9; xx += 1) {
			let p = board.at(xx, y)
			if (!hopped) {
				if (p instanceof Piece) {
					hopped = true
					continue
				}
				moves.push({ x: xx, y: y })
			} else {
				if (p instanceof Piece) {
					moves.push({ x: xx, y: y })
					break
				}
			}
		}

		hopped = false
		for (let yy = y - 1; yy >= 1; yy -= 1) {
			let p = board.at(x, yy)
			if (!hopped) {
				if (p instanceof Piece) {
					hopped = true
					continue
				}
				moves.push({ x: x, y: yy })
			} else {
				if (p instanceof Piece) {
					moves.push({ x: x, y: yy })
					break
				}
			}
		}

		hopped = false
		for (let yy = y + 1; yy <= 10; yy += 1) {
			let p = board.at(x, yy)
			if (!hopped) {
				if (p instanceof Piece) {
					hopped = true
					continue
				}
				moves.push({ x: x, y: yy })
			} else {
				if (p instanceof Piece) {
					moves.push({ x: x, y: yy })
					break
				}
			}
		}

		return moves
	}
}

// ------------------------------------------------------------------------------------

class General extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		if (x < 6) {
			moves.push({ x: x + 1, y: y })
		}
		if (x > 4) {
			moves.push({ x: x - 1, y: y })
		}
		if ((this.side == 0 && y < 3) || (this.side == 1 && y < 10)) {
			moves.push({ x: x, y: y + 1 })
		}
		if ((this.side == 0 && y > 1) || (this.side == 1 && y > 8)) {
			moves.push({ x: x, y: y - 1 })
		}

		return moves
	}
}

// ------------------------------------------------------------------------------------

class Banner extends Piece {
	reachableSpaces(x, y, board) {
		let moves = []

		let hopped = false
		for (let xx = x - 1; xx >= 1; xx -= 1) {
			let p = board.at(xx, y)
			if (!hopped) {
				moves.push({ x: xx, y: y })
				if (p instanceof Piece) {
					hopped = true
					continue
				}
			} else {
				if (p instanceof Piece) {
					moves.push({ x: xx, y: y })
					break
				}
			}
		}

		hopped = false
		for (let xx = x + 1; xx <= 9; xx += 1) {
			let p = board.at(xx, y)
			if (!hopped) {
				moves.push({ x: xx, y: y })
				if (p instanceof Piece) {
					hopped = true
					continue
				}
			} else {
				if (p instanceof Piece) {
					moves.push({ x: xx, y: y })
					break
				}
			}
		}

		hopped = false
		for (let yy = y - 1; yy >= 1; yy -= 1) {
			let p = board.at(x, yy)
			if (!hopped) {
				moves.push({ x: x, y: yy })
				if (p instanceof Piece) {
					hopped = true
					continue
				}
			} else {
				if (p instanceof Piece) {
					moves.push({ x: x, y: yy })
					break
				}
			}
		}

		hopped = false
		for (let yy = y + 1; yy <= 10; yy += 1) {
			let p = board.at(x, yy)
			if (!hopped) {
				moves.push({ x: x, y: yy })
				if (p instanceof Piece) {
					hopped = true
					continue
				}
			} else {
				if (p instanceof Piece) {
					moves.push({ x: x, y: yy })
					break
				}
			}
		}

		if (!(board.at(x + 1, y) instanceof Piece)) {
			moves.push({ x: x + 2, y: y - 1 })
			moves.push({ x: x + 2, y: y + 1 })
		}
		if (!(board.at(x - 1, y) instanceof Piece)) {
			moves.push({ x: x - 2, y: y - 1 })
			moves.push({ x: x - 2, y: y + 1 })
		}
		if (!(board.at(x, y + 1) instanceof Piece)) {
			moves.push({ x: x - 1, y: y + 2 })
			moves.push({ x: x + 1, y: y + 2 })
		}
		if (!(board.at(x, y - 1) instanceof Piece)) {
			moves.push({ x: x - 1, y: y - 2 })
			moves.push({ x: x + 1, y: y - 2 })
		}

		return moves
	}
}

// ------------------------------------------------------------------------------------

function getPiecesGivingCheckTo(player, board) {
	// find where the general is
	let general_pos = { x: 0, y: 0 }
	for (let x = 1; x <= 9; x++) {
		for (let y = 1; y <= 10; y++) {
			let p = board.at(x, y)
			if (p instanceof General && p.color == player) {
				general_pos = { x: x, y: y }
			}
		}
	}

	// see if the other player has any pieces that attack the general
	let pieces_giving_check = []
	for (let x = 1; x <= 9; x++) {
		for (let y = 1; y <= 10; y++) {
			let p = board.at(x, y)
			if (p instanceof Piece && p.color != player) {
				if (p instanceof Soldier) {
					// check the spaces immediately to the sides of the general
					if (y == general_pos.y && (x == general_pos.x + 1 || x == general_pos.x - 1)) {
						pieces_giving_check.push({ x: x, y: y })
					}
					// check the spaces immediately in front of the general
					if (x == general_pos.x && (
						(y == general_pos.y - 1 && player == 0)
						|| (y == general_pos.y + 1 && player == 1)
					)) {
						pieces_giving_check.push({ x: x, y: y })
					}
				} else if (p instanceof General) {
					// 飞将 rule
					if (x == general_pos.x) {
						let unobstructed = true
						for (let yy = Math.max(y, general_pos.y) - 1; yy > Math.min(y, general_pos.y); yy--) {
							if (board.at(x, yy) instanceof Piece) {
								unobstructed = false
							}
						}

						if (unobstructed) {
							pieces_giving_check.push({ x: x, y: y })
						}
					}
				} else {
					if (p instanceof Chariot || p instanceof Banner) {
						// check if the general is on the same row or column as the chariot
						// and has unobstructed access to the general
						if (x == general_pos.x || y == general_pos.y) {
							let unobstructed = true
							if (x == general_pos.x) {
								for (let yy = Math.max(y, general_pos.y) - 1; yy > Math.min(y, general_pos.y); yy--) {
									if (board.at(x, yy) instanceof Piece) {
										unobstructed = false
									}
								}
							} else {
								for (let xx = Math.max(x, general_pos.x) - 1; xx > Math.min(x, general_pos.x); xx--) {
									if (board.at(xx, y) instanceof Piece) {
										unobstructed = false
									}
								}
							}
	
							if (unobstructed) {
								pieces_giving_check.push({ x: x, y: y })
							}
						}
					} 

					if (p instanceof Horse || p instanceof Banner) {
						if ((x == general_pos.x - 2 && y == general_pos.y - 1 && !(board.at(x + 1, y) instanceof Piece))) {
							pieces_giving_check.push({ x: x, y: y })
						} else if ((x == general_pos.x + 2 && y == general_pos.y - 1 && !(board.at(x - 1, y) instanceof Piece))) {
							pieces_giving_check.push({ x: x, y: y })
						} else if ((x == general_pos.x - 2 && y == general_pos.y + 1 && !(board.at(x + 1, y) instanceof Piece))) {
							pieces_giving_check.push({ x: x, y: y })
						} else if ((x == general_pos.x + 2 && y == general_pos.y + 1 && !(board.at(x - 1, y) instanceof Piece))) {
							pieces_giving_check.push({ x: x, y: y })
						} else if ((x == general_pos.x - 1 && y == general_pos.y - 2 && !(board.at(x, y + 1) instanceof Piece))) {
							pieces_giving_check.push({ x: x, y: y })
						} else if ((x == general_pos.x + 1 && y == general_pos.y - 2 && !(board.at(x, y + 1) instanceof Piece))) {
							pieces_giving_check.push({ x: x, y: y })
						} else if ((x == general_pos.x - 1 && y == general_pos.y + 2 && !(board.at(x, y - 1) instanceof Piece))) {
							pieces_giving_check.push({ x: x, y: y })
						} else if ((x == general_pos.x + 1 && y == general_pos.y + 2 && !(board.at(x, y - 1) instanceof Piece))) {
							pieces_giving_check.push({ x: x, y: y })
						}
					} 
					
					if (p instanceof Cannon || p instanceof Banner) {
						// check if the general is on the same row or column as the cannon
						// with exactly one piece between them
						if (x == general_pos.x || y == general_pos.y) {
							let hopped = false
							if (x == general_pos.x) {
								for (let yy = Math.max(y, general_pos.y) - 1; yy > Math.min(y, general_pos.y); yy--) {
									if (!hopped && board.at(x, yy) instanceof Piece) {
										hopped = true
									} else if (hopped && board.at(x, yy) instanceof Piece) {
										hopped = false
										break
									}
								}
							} else {
								for (let xx = Math.max(x, general_pos.x) - 1; xx > Math.min(x, general_pos.x); xx--) {
									if (!hopped && board.at(xx, y) instanceof Piece) {
										hopped = true
									} else if (hopped && board.at(xx, y) instanceof Piece) {
										hopped = false
										break
									}
								}
							}
	
							if (hopped) {
								pieces_giving_check.push({ x: x, y: y })
							}
						}
					}
				} 
			}
		}
	}

	return pieces_giving_check
}

function acceptMove(from, to, board) {
	let piece = board.at(from.x, from.y)
	if (piece instanceof Piece) {
		let available_moves = [...piece.legalMoves(from.x, from.y, board)]
		for (let am of available_moves) {
			if (am.x == to.x && am.y == to.y) {
				return true
			}
		}
	}

	return false
}
