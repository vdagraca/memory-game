import React, { PureComponent } from 'react'
import { Card } from "./Card"
import './Board.css'

class Board extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            firstCard: null,
            flippingCards: 0,
        }
    }

    values = {
        checkFunction: () => {

            if (this.state.flippingCards < 2) {
                console.log('can continue...');
                return true;
            }
            else {
                console.log('already has two cards');
                return false;
            }
        },

        flippingCard: (args) => {
            let flippingCards = this.state.flippingCards + 1;
            this.setState({ flippingCards });

            if (flippingCards == 1) {
                this.setState({ firstCard: args.card });
            }
            else if (flippingCards == 2) {
                if (this.state.firstCard == args.card) {
                    this.setState({ flippingCards: 0 })
                    console.log('right!', this.state.firstCard);
                } else {
                    console.log('wrong!');

                    // next user
                    // [...]

                    // score
                    // [...]
                }
            }
        }
    }

    render() {
        return (

            this.props.board.map((row, rowIndex) =>
                <div className="cards">
                    {row.map((picture, columnIndex) => <Card
                        picture={picture}
                        values={this.values}
                        makeMove={this.props.makeMove}
                        flipped={this.props.flipped[rowIndex][columnIndex]}
                    />)}
                </div>
            )
        )
    }
}

// this.props.board.map(rowIndex =>
//     rowIndex.map(tile => tile =
//         <img key={rowIndex} src="/images/back.png" alt="backtile" className="cards" />))


export default Board