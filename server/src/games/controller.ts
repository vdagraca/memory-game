import {
  JsonController, Authorized, CurrentUser, Post, Param, BadRequestError, HttpCode, NotFoundError, ForbiddenError, Get,
  Body, Patch
} from 'routing-controllers'
import User from '../users/entity'
import { Game, Player, Board, flipBoard } from './entities'
import { IsBoard, isValidTransition, calculateWinner, finished, randomize } from './logic'
import { Validate } from 'class-validator'
import { io } from '../index'
import images from './imagesDatabase'

@JsonController()
export default class GameController {

  @Authorized()
  @Post('/games')
  @HttpCode(201)
  async createGame(
    @CurrentUser() user: User
  ) {

    const fullArray = randomize()
    
    const array1 = fullArray.slice(0, 8)
    const array2 = fullArray.slice(8, 16)
    const array3 = fullArray.slice(16, 24)
    const array4 = fullArray.slice(24, 32)
    const array5 = fullArray.slice(32, 40)
    const array6 = fullArray.slice(40, 48)
    const array7 = fullArray.slice(48, 56)

    const game = new Game()
    game.board = [array1, array2, array3, array4, array5, array6, array7]

    await game.save()

    await Player
      .create({
        game: game,
        user,
        symbol: 'x',
      })
      .save()

    const newGame = await Game.findOneById(game.id)
    if (!newGame) throw new BadRequestError(`Game does not exist`)

    const randomRowIndex = Math.floor(Math.random() * newGame.flipped.length)
    const randomRow = newGame.flipped[randomRowIndex]
    const randomColumnIndex = Math.floor(Math.random() * randomRow.length)
    randomRow[randomColumnIndex] = true

    await newGame.save()

    io.emit('action', {
      type: 'ADD_GAME',
      payload: newGame
    })

    return newGame
  }

  @Authorized()
  @Post('/games/:id([0-9]+)/players')
  @HttpCode(201)
  async joinGame(
    @CurrentUser() user: User,
    @Param('id') gameId: number
  ) {
    const game = await Game.findOneById(gameId)
    if (!game) throw new BadRequestError(`Game does not exist`)
    if (game.status !== 'pending') throw new BadRequestError(`Game is already started`)

    game.status = 'started'
    await game.save()

    const player = await Player.create({
      game,
      user,
      symbol: 'o',
    }).save()

    io.emit('action', {
      type: 'UPDATE_GAME',
      payload: await Game.findOneById(game.id)
    })

    return player
  }

  @Authorized()
  // the reason that we're using patch here is because this request is not idempotent
  // http://restcookbook.com/HTTP%20Methods/idempotency/
  // try to fire the same requests twice, see what happens
  @Patch('/games/:id([0-9]+)')
  async updateGame(
    @CurrentUser() user: User,
    @Param('id') gameId: number,
    @Body() pictureId: number
  ) {
    console.log('pictureId',pictureId)
    
    const game = await Game.findOneById(gameId)
    if (!game) throw new NotFoundError(`Game does not exist`)

    const player = await Player.findOne({ user, game })
    if (!player) throw new ForbiddenError(`You are not part of this game`)
    if (game.status !== 'started') throw new BadRequestError(`The game is not started yet`)

    let targetRow, targetColumn
    game
      .board
      .map((row, rowIndex) => {
        row.map((id, columnIndex) => {
          const isTarget = id === pictureId
          
          if (isTarget) {
            targetRow = rowIndex
            targetColumn = columnIndex
          }
        })
      })
    
    console.log('targetRow test:', targetRow)
    console.log('targetColumn test:', targetColumn)
    game.flipped[targetRow][targetColumn] = true

    const image: any = images.find(image => image.id === pictureId)
    const { coupleId } = image
    
    if (game.first) {
      if (coupleId !== game.first) {
        game.flipped = game.flipped.map(row => {
          return row.map(() => false)
        })
        console.log('game.flipped reset test:', game.flipped)
        console.log('targetRow test:', targetRow)
        const row = game.flipped[targetRow]
        console.log('row test:', row)
        console.log('targetColumn test:', targetColumn)
        row[targetColumn] = true // Show only the last guessed card
        console.log('game.flipped after test:', game.flipped)
      }

      game.first = null
    } else {
      game.first = coupleId
    }

    console.log('game.flipped test:', game.flipped)
    await game.save()

    io.emit('action', {
      type: 'UPDATE_GAME',
      payload: game
    })

    return game
  }

  @Authorized()
  @Get('/games/:id([0-9]+)')
  getGame(
    @Param('id') id: number
  ) {
    return Game.findOneById(id)
  }

  @Authorized()
  @Get('/games')
  getGames() {
    return Game.find()
  }



}
