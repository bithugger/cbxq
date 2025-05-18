let font
function preload(){
	font = loadFont('KNYuanmo-Regular.ttf')
}

const piece_colors = [
	22,
	150
]

const piece_text_colors = [
	150,
	22
]

// ------------------------------------------------------------------------------------

let focused_piece
let focused_pos = { x: 0, y: 0 }

// ------------------------------------------------------------------------------------

let board_scale = 1
let board_offset_x = 0
let board_offset_y = 0
let board_layer

let score_0_pos = { x: 0, y: 0 }
let score_1_pos = { x: 0, y: 0 }

function setup() {
  createCanvas(windowWidth, windowHeight)
	textFont(font)
	board_layer = createGraphics(windowWidth, windowHeight)
	board_layer.textFont(font)
	setupCanvas()
	newGame()
	drawBoard(board)
}

// Resize the canvas when the browser's size changes.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
	board_layer.resizeCanvas(windowWidth, windowHeight)
	setupCanvas()
	drawBoard(board)
}

function setupCanvas(){
	let horizontal_padding = 30
	let w = width - 2*horizontal_padding
	let vertical_padding = 30
	let h = height - 2*vertical_padding
	board_scale = Math.min(w / 10, h / 11)
	board_offset_x = width/2 - 5*board_scale
	board_offset_y = vertical_padding
	
	if(w >= h){
		score_0_pos.x = -board_offset_x / 2 / board_scale
		score_0_pos.y = 5.5
		score_1_pos.x = 10 + board_offset_x / 2 / board_scale
		score_1_pos.y = 5.5
	}else{
		score_0_pos.x = 3
		score_0_pos.y = 11 + ( h / board_scale - 11 ) / 2
		score_1_pos.x = 7
		score_1_pos.y = 11 + ( h / board_scale - 11 ) / 2
	}
}

// ------------------------------------------------------------------------------------

let mtx = 0
let mty = 0
let mouse_press_rem = { x: 0, y: 0 }

function touchMoved(){
	if(touches.length >= 1){
		mtx = touches[0].x
		mty = touches[0].y
	}
	return false
}

function mouseDragged(){
	mtx = mouseX
	mty = mouseY
	return false
}

function mouseMoved(){
	mtx = mouseX
	mty = mouseY
	return false
}

function mousePressed() {
	touchOrMouseDown(mouseX, mouseY)
	return false
}

function touchStarted(){
	if(touches.length == 1){
		mtx = touches[0].x
		mty = touches[0].y
		touchOrMouseDown(touches[0].x, touches[0].y)
	}
	return false
}

function touchEnded(){
	touchOrMouseUp(mtx, mty)
	return false
}

function mouseReleased(){
	touchOrMouseUp(mtx, mty)
	return false
}

function touchOrMouseDown(mx, my){
	if(!manual_input){
		return false
	}
	
	let x = Math.round( (mx - board_offset_x) / board_scale)
	let y = Math.round( (my - board_offset_y) / board_scale)
	
	if(x < 1 || x > 9 || y < 1 || y > 10){
		return false
	}
	
	let p = board.at(x, y)
	if(p instanceof Piece && p.color == player_turn){
		focused_piece = p
		mouse_press_rem = { x: (mx - board_offset_x) / board_scale - x, y: (my - board_offset_y) / board_scale - y }
		focused_pos = { x: x, y: y }
	}else{
		focused_piece = undefined
		mouse_press_rem = { x: 0, y: 0 }
		focused_pos = { x: 0, y: 0 }
	}
	
	drawBoard(board)
}

function touchOrMouseUp(mx, my){
	if(!manual_input){
		return false
	}
	
	if(focused_piece instanceof Piece){
		let bx = (mx - board_offset_x) / board_scale
		let by = (my - board_offset_y) / board_scale
		let px = bx - mouse_press_rem.x
		let py = by - mouse_press_rem.y
		let x = Math.round( px )
		let y = Math.round( py )

		if(x >= 1 && x <= 9 && y >= 1 && y <= 10){
			if(acceptMove(focused_pos, {x, y}, board)){
				board = board.afterMove(i(focused_pos.x, focused_pos.y), i(x, y))
				player_turn = 1 - player_turn
				
				// make the move and check if the game continues
				if(!makeMove(player_turn, board)){
					drawBoard(board)
					// game over, start new game after a brief pause
					setTimeout(() => {
						newGame()
					}, 5000)
				}
			}
		}
		
		focused_piece = undefined
		focused_pos = { x: 0, y: 0 }
		
		drawBoard(board)
	}
}

// ------------------------------------------------------------------------------------

function drawPlusIndicator(x, y){
	board_layer.push()
	board_layer.strokeWeight(0.03)
	let xm = x > 1 ? x - 0.2 : x
	let xp = x < 9 ? x + 0.2 : x
	let ym = y > 1 ? y - 0.2 : y
	let yp = y < 10 ? y + 0.2 : y
	board_layer.line(xm, y, xp, y)
	board_layer.line(x, ym, x, yp)
	board_layer.pop()
}

function drawBackground(){
  board_layer.background(22)
	
	// river
	board_layer.noStroke()
	board_layer.fill(75)
	board_layer.rect(1, 5, 8, 1)
	
	// rank and file lines
	board_layer.stroke(75)
	board_layer.noFill()
	board_layer.strokeWeight(0.015)
	for(let x = 2; x < 9; x++){
		board_layer.line(x, 1, x, 5)
		board_layer.line(x, 6, x, 10)
	}
	
	for(let y = 2; y < 10; y++){
		if(y == 6 || y == 5){
			continue
		}
		board_layer.line(1, y, 9, y)
	}
	
	// diagonal palace lines
	board_layer.line(4, 1, 6, 3)
	board_layer.line(6, 1, 4, 3)
	
	board_layer.line(4, 8, 6, 10)
	board_layer.line(6, 8, 4, 10)
	
	// palace outline
	board_layer.strokeWeight(0.03)
	board_layer.stroke(150)
	board_layer.rect(4, 1, 2, 2)
	board_layer.rect(4, 8, 2, 2)
	
	// board outline
	board_layer.stroke(150)
	board_layer.strokeWeight(0.05)
	board_layer.rect(1, 1, 8, 9)
	
	// soldier and cannon place indicators
	drawPlusIndicator(2, 3)
	drawPlusIndicator(8, 3)
	drawPlusIndicator(1, 4)
	drawPlusIndicator(3, 4)
	drawPlusIndicator(5, 4)
	drawPlusIndicator(7, 4)
	drawPlusIndicator(9, 4)
	
	drawPlusIndicator(2, 8)
	drawPlusIndicator(8, 8)
	drawPlusIndicator(1, 7)
	drawPlusIndicator(3, 7)
	drawPlusIndicator(5, 7)
	drawPlusIndicator(7, 7)
	drawPlusIndicator(9, 7)
}

function polygon(x, y, diameter, npoints) {
  let angle = TWO_PI / npoints
	let radius = diameter / 2
  board_layer.beginShape()
  for (let a = angle / 2; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius
    let sy = y + sin(a) * radius
    board_layer.vertex(sx, sy)
  }
  board_layer.endShape(CLOSE)
}

function drawPiece(x, y, piece){
	board_layer.push()
	board_layer.translate(x, y)
	
	board_layer.fill(piece_colors[piece.color])
	board_layer.stroke(150)
	board_layer.strokeWeight(0.04)
	polygon(0, 0, 0.9, 8)
	
	board_layer.strokeWeight(0.01)
	board_layer.fill(piece_text_colors[piece.color])
	board_layer.stroke(piece_text_colors[piece.color])
	
	board_layer.noStroke()
	board_layer.textSize(0.5)
	board_layer.textAlign(CENTER, CENTER)
	board_layer.text(piece.symbol, 0, -0.05)
	
	board_layer.pop()
}

function drawHighlight(x, y, color){
	board_layer.push()
	board_layer.translate(x, y)
	
	board_layer.fill(color)
	board_layer.noStroke()
	polygon(0, 0, 1.05, 8)
	
	board_layer.pop()
}

function toChineseNumber(n) {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const positions = ['', '拾', '佰', '仟', '万', '拾万', '佰万', '仟万', '亿', '拾亿', '佰亿', '仟亿']
  const charArray = String(n).split('')
  let result = ''
  let prevIsZero = false
	
  for (let i = 0; i < charArray.length; i++) {
    const ch = charArray[i]
    if (ch !== '0' && !prevIsZero) {
      result += digits[parseInt(ch)] + positions[charArray.length - i - 1]
    } else if (ch === '0') {
      prevIsZero = true
    } else if (ch !== '0' && prevIsZero) {
      result += '零' + digits[parseInt(ch)] + positions[charArray.length - i - 1]
    }
  }
	if(result.length == 0){
		result = '零'
	}
	
  if (n < 100) {
    result = result.replace('壹拾', '拾')
  }
  return result;
}

function drawScores(){
	board_layer.push()
	board_layer.rectMode(CENTER)
	
	// highlight
	board_layer.noStroke()
	board_layer.fill("#aaaa44")
	if(score_highlight[0]){
		board_layer.rect(score_0_pos.x, score_0_pos.y, 3.2, 1.7)
	}
	if(score_highlight[1]){
		board_layer.rect(score_1_pos.x, score_1_pos.y, 3.2, 1.7)
	}
	
	// backgrounds
	board_layer.stroke(piece_text_colors[0])
	board_layer.fill(piece_colors[0])
	board_layer.rect(score_0_pos.x, score_0_pos.y, 3, 1.5)
	
	board_layer.stroke(piece_text_colors[1])
	board_layer.fill(piece_colors[1])
	board_layer.rect(score_1_pos.x, score_1_pos.y, 3, 1.5)
	
	// names and scores
	board_layer.textSize(0.4)
	board_layer.textAlign(CENTER, CENTER)
	board_layer.noStroke()
	board_layer.fill(piece_text_colors[0])
	board_layer.text(BLACK_PLAYER_NAME, score_0_pos.x, score_0_pos.y - 0.4)
	board_layer.fill(piece_text_colors[1])
	board_layer.text(WHITE_PLAYER_NAME, score_1_pos.x, score_1_pos.y - 0.4)
	
	board_layer.textSize(0.5)
	board_layer.fill(piece_text_colors[0])
	board_layer.text(toChineseNumber(scores[0]), score_0_pos.x, score_0_pos.y + 0.25)
	board_layer.fill(piece_text_colors[1])
	board_layer.text(toChineseNumber(scores[1]), score_1_pos.x, score_1_pos.y + 0.25)
	
	board_layer.pop()
}

function drawBoard(b){
	board_layer.push()
	board_layer.translate( board_offset_x, board_offset_y )
	board_layer.scale( board_scale, board_scale )
	drawBackground()
	drawScores()
	
	// highlights
	let checking_pieces = [getAllPiecesGivingCheckTo(0, b), getAllPiecesGivingCheckTo(1, b)]
	
	for(let x = 1; x <= 9; x++){
		for(let y = 1; y <= 10; y++){
			let p = b.at(x, y)
			if(p instanceof Piece){
				if(p != focused_piece && p != moving_piece){
					
					let giving_check = false
					for(let cp of checking_pieces[1 - p.color]){
						let cp_pos = coords(cp)
						if(cp_pos.x == x && cp_pos.y == y){
							giving_check = true
							break
						}
					}
					
					if(giving_check){
						drawHighlight(x, y, "#aaaa44")
					}

					if(p instanceof General && checking_pieces[p.color].length > 0){
						drawHighlight(x, y, "#aa4444")
					}
					
					drawPiece(x, y, p)
				}
			}
		}
	}
	
	board_layer.pop()
}

// ------------------------------------------------------------------------------------

function drawMoveMarker(x, y, thick){
	push()
	noFill()
	stroke(thick ? 200 : 175)
	strokeWeight(thick ? 0.1 : 0.05)
	circle(x, y, 0.3)
	pop()
}

function overlayPolygon(x, y, diameter, npoints) {
  let angle = TWO_PI / npoints
	let radius = diameter / 2
  beginShape()
  for (let a = angle / 2; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius
    let sy = y + sin(a) * radius
    vertex(sx, sy)
  }
  endShape(CLOSE)
}

function drawPieceOverlay(x, y, piece){
	push()
	translate(x, y)
	
	fill(piece_colors[piece.color])
	stroke(150)
	strokeWeight(0.04)
	overlayPolygon(0, 0, 0.9, 8)
	
	strokeWeight(0.01)
	fill(piece_text_colors[piece.color])
	stroke(piece_text_colors[piece.color])
	
	noStroke()
	textSize(0.5)
	textAlign(CENTER, CENTER)
	text(piece.symbol, 0, -0.05)
	
	pop()
}

// ------------------------------------------------------------------------------------

let move_animation_frames_remaining = -2
let move_target = 0
let move_source = 0
let moving_piece
let move_animation_complete_callback

function animateMove(from, to, board, callback){
	move_animation_frames_remaining = move_animation_frames
	moving_piece = board.spaces[from]
	move_source = from
	move_target = to
	move_animation_complete_callback = callback
	drawBoard(board)
}

function smoothstep(x){
	return Math.min(1, Math.max(0, 6*x*x*x*x*x - 15*x*x*x*x + 10*x*x*x))
}

function draw() {
	image(board_layer, 0, 0)
	
	push()
	translate( board_offset_x, board_offset_y )
	scale( board_scale, board_scale )
	
	if(manual_input){
		fill(100)
		noStroke()
		if(flipped){
			circle(0, 7 - 3*player_turn, 0.25)
		}else{
			circle(0, 4 + 3*player_turn, 0.25)
		}
		
		if(focused_piece instanceof Piece){
			let x = (mtx - board_offset_x) / board_scale
			let y = (mty - board_offset_y) / board_scale
			let px = x - mouse_press_rem.x
			let py = y - mouse_press_rem.y

			let moves = focused_piece.legalMoves(focused_pos.x, focused_pos.y, board)
			for(let m of moves){
				let mm = coords(m)
				let thick = Math.round(px) == mm.x && Math.round(py) == mm.y
				drawMoveMarker(mm.x, mm.y, thick)
			}

			drawPieceOverlay(px, py, focused_piece)
		}
	}else{
		if(move_animation_frames_remaining >= 0){
			let t = smoothstep(move_animation_frames_remaining / move_animation_frames)
			let from = coords(move_source)
			let to = coords(move_target)
			let px = from.x * t + to.x * (1 - t)
			let py = from.y * t + to.y * (1 - t)
			drawPieceOverlay(px, py, moving_piece)
			move_animation_frames_remaining -= 1
		}else if(move_animation_frames_remaining == -1){
			board = board.afterMove(move_source, move_target)
			move_source = 0
			move_target = 0
			moving_piece = undefined
			move_animation_frames_remaining = -2
			drawBoard(board)
			move_animation_complete_callback()
			drawBoard(board)
		}
	}
	
	pop()
}
