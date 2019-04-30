import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'
import { Board, Symbol } from './entities'

@ValidatorConstraint()
export class IsBoard implements ValidatorConstraintInterface {

  validate(board: Board) {
    return board.every(row => typeof row.flipped !== 'undefined' && typeof row.matched !== 'undefined')
  }
}

export const isValidTransition = (from: Board, to: Board) => {
  const oldHands = from.filter(row => row.flipped)
  const newHands = to.filter(row => row.flipped)
  const flippedHands = newHands.length - oldHands.length;

  if (flippedHands !== 1) return false
  else return true
}

export const calculateWinner = (board: Board): Symbol | null => {
  return null
}

export const finished = (board: Board): boolean =>
  board.every(row => row.matched)

export const updateBoard = (board: Board): Board => {
  const flippedHands = board.filter(row => row.flipped)

  if (flippedHands.length < 2) { // Return old board
    return board
  }
  else if (flippedHands[0].id === flippedHands[1].id) { // match found
    board.map(row => {
      if (row.id === flippedHands[0].id) {
        row.flipped = false;
        row.matched = true;
      }

      return row;
    })
  }

  return board;
}

export const matchFound = (oldBoard: Board, newBoard: Board): boolean => {
  return newBoard.filter(row => row.matched).length > oldBoard.filter(row => row.matched).length
}

export const missMatch = (board: Board): boolean =>
  board.filter(row => row.flipped).length >= 2

export const resetBoard = (board: Board): Board =>
  board.map(row => { row.flipped = false; return row })

