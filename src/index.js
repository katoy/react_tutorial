import "./index.css";

import React from "react";
import ReactDOM from "react-dom";

const DIM = 4;
const MARKS = { "1": "O", "-1": "X" };

function Square(props) {
  let className = "square";
  if (props.mark) {
    className += " mark";
  }
  return (
    <button className={className} onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i, isMark) {
    return (
      <Square
        key={"square-" + i}
        mark={isMark}
        value={MARKS[String(this.props.squares[i])]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    let board = [];
    let row = [];
    for (let y = 0; y < DIM; y++) {
      var cells = [];
      for (let x = 0; x < DIM; x++) {
        var seq = y * DIM + x;
        cells.push(this.renderSquare(seq, this.props.markSeqs.includes(seq)));
      }
      row.push(
        <div className="board-row" key={"row-" + y}>
          {cells}
        </div>
      );
    }
    board.push(row);

    return <div>{board}</div>;
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [
        {
          squares: Array(DIM * DIM).fill(null),
          lastHand: null
        }
      ],
      stepNumber: 0,
      turn: 1,
      isMarkLastHand: false
    };
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    const game_result = calculateWinner(squares);
    if (game_result["winer"] || squares[i]) {
      return;
    }

    squares[i] = this.state.turn;
    this.setState({
      history: history.concat([
        {
          squares: squares,
          lastHand: seq_to_hand(i)
        }
      ]),
      stepNumber: history.length,
      turn: -this.state.turn
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      ignoreOnLeave: true,
      isMarkLastHand: false,
      turn: step % 2 === 0 ? 1 : -1
    });
  }

  showHand(step) {
    this.setState({
      stepNumber: step,
      ignoreOnLeave: false,
      isMarkLastHand: true
    });
  }

  showCurrent() {
    let stepNumber;
    if (this.state.ignoreOnLeave) {
      stepNumber = this.state.stepNumber;
    } else {
      stepNumber = this.state.history.length - 1;
    }

    this.setState({
      stepNumber: stepNumber,
      ignoreOnLeave: false,
      isMarkLastHand: false
    });
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const game_result = calculateWinner(current.squares);
    const winner = MARKS[String(game_result["winer"])];

    const moves = history.map((step, move) => {
      const label = move ? "[" + step.lastHand + "]" : "start";
      return (
        <li key={move}>
          <button
            className="history-button"
            onClick={() => this.jumpTo(move)}
            onMouseEnter={() => this.showHand(move)}
            onMouseLeave={() => this.showCurrent()}
          >
            {label}
          </button>
        </li>
      );
    });

    let status;
    let markSeqs = [];
    if (game_result["isDraw"]) {
      status = "Draw:";
    } else if (winner) {
      status = "Winner: " + winner;
      markSeqs = game_result["line"];
    } else {
      status = "Next player: " + MARKS[String(this.state.turn)];
      if (this.state.isMarkLastHand && current.lastHand) {
        markSeqs = [hand_to_seq(current.lastHand)];
      }
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            markSeqs={markSeqs}
            onClick={i => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}

// ========================================
ReactDOM.render(<Game />, document.getElementById("root"));

function calculateWinner(squares) {
  const lines = check_lines();
  for (let line of lines) {
    let winer = squares[line[0]];
    if (!winer) {
      continue;
    }

    for (let p of line) {
      if (squares[p] !== winer) {
        winer = null;
        break;
      }
    }
    if (winer) {
      return { winer: winer, line: line, isDraw: false };
    }
  }
  return { winer: null, line: [], isDraw: !squares.includes(null) };
}

function check_lines() {
  let lines = [];
  for (let i = 0; i < DIM; i++) {
    // 横
    let ls = [[], []];
    for (let j = 0; j < DIM; j++) {
      ls[0].push(i * DIM + j);
      ls[1].push(i + DIM * j);
    }
    lines.push(ls[0].slice(0, DIM)); // 横
    lines.push(ls[1].slice(0, DIM)); // 縦
  }

  // 対角線
  let digs = [[], []];
  for (let i = 0; i < DIM; i++) {
    digs[0].push(i * DIM + i);
    digs[1].push((i + 1) * DIM - i - 1);
  }
  lines.push(digs[0]);
  lines.push(digs[1]);
  return lines;
}

function hand_to_seq(hand) {
  return (hand[0] - 1) * DIM + hand[1] - 1;
}

function seq_to_hand(seq) {
  return [1 + Math.floor(seq / DIM), 1 + (seq % DIM)];
}
