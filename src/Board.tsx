import React, { Component } from 'react';
import './Board.css';
import icon from './images/icon.png';
import check from './images/check.png';
import die0 from './images/0.png';
import die1 from './images/1.png';
import die2 from './images/2.png';
import die3 from './images/3.png';
import die4 from './images/4.png';
import die5 from './images/5.png';
import die6 from './images/6.png';

export interface BoardState {
    isRolling: boolean;
    dice: Die[];
    isButtonDown: boolean;
    rollsComplete: number;
    currentPlayer: number;
    scoreSelectionPosition: number;
    players: Player[];
}

export class Player {
    number: number;
    name: string;
    gamesPlayed: number;
    highScore: number;
    avgScore: number;
    totalYotsees: number;
    avgYotsees: number;
    scores: (number | null)[];
    yosteeBonus: 0 | 1 | 2 | 3;

    constructor(
        number: number,
        name: string,
        gamesPlayed: number,
        highScore: number,
        avgScore: number,
        totalYotsees: number,
        avgYotsees: number,
    ) {
        this.number = number;
        this.name = name;
        this.gamesPlayed = gamesPlayed;
        this.highScore = highScore;
        this.avgScore = avgScore;
        this.totalYotsees = totalYotsees;
        this.avgScore = avgScore;
        this.avgYotsees = avgYotsees;
        this.scores = Array.apply(null, Array(13)) as (number | null)[];
        this.yosteeBonus = 0;
    }
}

enum Score {
    Aces = 0,
    Twos = 1,
    Threes = 2,
    Fours = 3,
    Fives = 4,
    Sixes = 5,
    ThreeOfKind = 6,
    FourOfKind = 7,
    FullHouse = 8,
    SmallStraight = 9,
    LargeStraight = 10,
    Yotsee = 11,
    Chance = 12,
    TopSub = 13,
    Bonus = 14,
    TopTotal = 15,
    BottomTotal = 16,
    GrandTotal = 17
}

export class Die {
    value: number;
    isLocked: boolean;

    constructor(value: number, isLocked: boolean) {
        this.value = value;
        this.isLocked = isLocked;
    }
}

export class Sound {
    [name: string]: HTMLAudioElement;

    constructor(name: string) {
        this[name] = new Audio(require(`./sounds/${name}.ogg`));
    }
}

export class Board extends Component<{}, BoardState> {
    timeoutMs: number = 100;
    dieIndexes: number[] = [0,1,2,3,4];
    dieValueIndexes: number[] = [0,1,2,3,4,5,6];
    maxPlayerIndexes: number[] = [0,1,2,3,4,5];

    dieImages: string[] = [
        die0,
        die1,
        die2,
        die3,
        die4,
        die5,
        die6,
    ];

    sounds: { [name: string]: HTMLAudioElement; } = {};

    constructor(props: {}) {
        super(props);

        const dice: Die[] = Array<Die>();

        this.dieIndexes.forEach(() => dice.push(new Die(1, false)));

        const players: Player[] = Array<Player>();

        for(let i=0; i<1; i++) {
            players.push(new Player(i, `Player ${i}`, 0, 0, 0, 0, 0));
        }

        this.state = {
            isRolling: false,
            isButtonDown: false,
            dice: dice,
            rollsComplete: 0,
            currentPlayer: 0,
            scoreSelectionPosition: 0,
            players: players,
        };
    }

    handleKeydown = (event: KeyboardEvent) => {
        const { currentPlayer, scoreSelectionPosition, players } = this.state;
        const { scores } = players[currentPlayer];

        // Enter
        if (event.keyCode === 32 || event.keyCode === 13) {
            if (this.isScoring()) {
                this.endTurn();
            } else if (this.state.isRolling) {
                this.stopRolling();
            } else {
                this.startRolling();
            }
            return;
        }

        // 1-5
        if (event.keyCode > 48 && event.keyCode < 54) {
            this.toggleDieLock(event.keyCode - 49);
            return;
        }

        if (!this.isScoring()) {
            return;
        }


        // Up
        if (event.keyCode === 87 || event.keyCode === 38) {
            console.log("Up key");

            this.setState({
                scoreSelectionPosition: this.getNextScoreSelectionPosition(scoreSelectionPosition, -1)
            });

            return;
        }

        // Down
        if (event.keyCode === 83 || event.keyCode === 40) {
            console.log("Down key");

            this.setState({
                scoreSelectionPosition: this.getNextScoreSelectionPosition(scoreSelectionPosition, 1)
            });

            return;
        }
    }

    componentDidMount() {
        this.addSound("click");
        this.addSound("endgame");
        this.addSound("endroll1");
        this.addSound("endroll2");
        this.addSound("endroll3");
        this.addSound("endroll4");
        this.addSound("endroll5");
        this.addSound("intro");
        this.addSound("lock");
        this.addSound("mad");
        this.addSound("rollem");
        this.addSound("rolling");
        this.addSound("score");
        this.addSound("ugotit");
        this.addSound("unlock");
        this.addSound("wild");
        this.addSound("yotsee");
        this.addSound("test");
        this.addSound("test2");

        this.sounds["rolling"].loop = true;
        this.sounds["rolling"].addEventListener('timeupdate', function(){
            var buffer = 0.1
            if(this.currentTime > this.duration - buffer){
                this.currentTime = 0
                this.play()
            }
        });

        document.addEventListener("keydown", this.handleKeydown, false);

        this.playSound("rollem");
    }

    componentWillUnmount(){
        document.removeEventListener("keydown", this.handleKeydown, false);
    }
          
    addSound(name: string) {
        this.sounds[name] = new Audio(require(`./sounds/${name}.${name === "lock" || name === "unlock" ? "mp3" : "ogg"}`));
    }

    boardRow(label: string, score: Score, tip?: string) {
        return (
            <tr>
                <td>
                    <div>{label}</div>
                    {tip && <div>{tip}</div>}
                </td>
                {this.maxPlayerIndexes.map(i => 
                    <td className={
                            `${i === this.state.currentPlayer ? `Player-${i}` : ""} ` + 
                            `${this.state.currentPlayer === i && this.state.scoreSelectionPosition === score ? `Score-Selector` : ""}`
                        }
                        key={`boardRow-${i}`}
                    >
                        {this.calculateCurrentScore(i, score)}
                    </td>
                )}
            </tr>
        );
    }

    boardRowYotsee() {
        return (
            <tr className="Board-Score-Card-Label-Yotsee">
                <td>
                    <div>
                        <div>Yotsee</div><div>SCORE 50</div>
                    </div>
                    <div>
                        <div>Yotsee Bonus</div><div>SCORE 100</div>
                    </div>
                </td>
                {this.maxPlayerIndexes.map(i => {
                    const { players, currentPlayer, scoreSelectionPosition } = this.state;
                    const player = players[i];
                    return (
                        <td className={
                                `${i === currentPlayer ? `Player-${i}` : ""} ` + 
                                `${currentPlayer === i && scoreSelectionPosition === Score.Yotsee ? `Score-Selector` : ""}`
                            } 
                            key={`boardRow-${i}`}
                        >
                            <div>
                                {this.calculateCurrentScore(i, Score.Yotsee)}
                            </div>
                            <div>
                                {player && player.yosteeBonus > 0 && <img src={check} alt="Yotsee bonus" />}
                                {player && player.yosteeBonus > 1 && <img src={check} alt="Yotsee bonus" />}
                                {player && player.yosteeBonus > 2 && <img src={check} alt="Yotsee bonus" />}
                            </div>
                        </td>
                    );
                })}
            </tr>
        );
    }

    valueCountsWithWild = (): number[] => 
        this.dieValueIndexes.map(i => this.state.dice.filter(d => d.value === 0 || d.value === i).length);

    valueCountsWithoutWild = (): number[] => 
        this.dieValueIndexes.map(i => this.state.dice.filter(d => d.value === i).length);

    calculateCurrentScore(playerNumber: number, score: Score): number | null {
        const { dice, players, currentPlayer } = this.state;

        if (playerNumber > players.length - 1) {
            return null;
        }

        const scores = players[playerNumber].scores;

        const valueCountsWithWild = this.valueCountsWithWild();
        const valueCountsWithoutWild = this.valueCountsWithoutWild();
        const multiplier = valueCountsWithWild[0] + 1;
        const diceSum = dice.reduce((a, b) => a + b.value, 0);

        if (score < Score.TopSub && (playerNumber !== currentPlayer || this.state.scoreSelectionPosition !== score || !this.isScoring())) {
            return scores[score];
        }

        switch (score) {
            case Score.Aces:
            case Score.Twos:
            case Score.Threes:
            case Score.Fours:
            case Score.Fives:
            case Score.Sixes:
                return valueCountsWithWild[score - Score.Aces + 1] * (score - Score.Aces + 1) * multiplier;
            case Score.ThreeOfKind:
            case Score.FourOfKind: {
                const ofAKind = (score === Score.ThreeOfKind) ? 3 : 4;

                console.log("ofAKind", ofAKind);

                const moreThanThreeDice = valueCountsWithWild.filter(c => c >= ofAKind);

                console.log("moreThanThreeDice", moreThanThreeDice.length);

                if (moreThanThreeDice.length === 0) {
                    return 0;
                }

                console.log("valueCountsWithWild[0]", valueCountsWithWild[0]);

                if (valueCountsWithWild[0] === 0) {
                    return diceSum * multiplier;
                }

                console.log("aboutToLoop");

                for (let i = 6; i >= 0; i--) {
                    console.log("i", i);
                    console.log("valueCountsWithWild[i]", valueCountsWithWild[i]);
                    if (valueCountsWithWild[i] >= ofAKind) {
                        return (diceSum + (valueCountsWithWild[0] * (valueCountsWithWild[0] < ofAKind ? i : 10))) * multiplier;
                    }
                }

                return 0;
            }
            case Score.FullHouse: {
                if (valueCountsWithWild.filter((v, i) => i > 0 && v >= 2).length == 2 && 
                    valueCountsWithWild.filter((v, i) => i > 0 && v === 0).length == 4) {
                    return 25 * multiplier;
                }
                return 0;
            }
            case Score.SmallStraight: {
                let totalRealValues = 
                    (valueCountsWithoutWild[3] > 0 ? 1 : 0) +
                    (valueCountsWithoutWild[4] > 0 ? 1 : 0) + 
                    (valueCountsWithoutWild[1] > 0 && valueCountsWithoutWild[2] ? 2 : 0) +
                    (valueCountsWithoutWild[2] > 0 && valueCountsWithoutWild[5] ? 2 : 0) +
                    (valueCountsWithoutWild[5] > 0 && valueCountsWithoutWild[6] ? 2 : 0);
                
                if (totalRealValues + valueCountsWithoutWild[0] >= 4) {
                    return 30 * multiplier;
                }
                return 0;
            }
            case Score.LargeStraight: {
                let totalRealValues = 
                    (valueCountsWithoutWild[2] > 0 ? 1 : 0) +
                    (valueCountsWithoutWild[3] > 0 ? 1 : 0) + 
                    (valueCountsWithoutWild[4] > 0 ? 1 : 0) + 
                    (valueCountsWithoutWild[5] > 0 ? 1 : 0) +
                    (valueCountsWithoutWild[1] > 0 || valueCountsWithoutWild[6] ? 1 : 0);
                
                if (totalRealValues + valueCountsWithoutWild[0] === 5) {
                    return 40 * multiplier;
                }
                return 0;
            }
            case Score.Yotsee: {
                const nonZeroValues = valueCountsWithoutWild.filter((v, i) => i > 0 && v > 0).length;
                if (nonZeroValues == 1) {
                    if (scores[Score.Yotsee] ?? 0 > 0) {
                        return (scores[Score.Yotsee] ?? 0) + (100 * multiplier);
                    }
                    return 50 * multiplier;
                }
                if (nonZeroValues == 0) {
                    if (scores[Score.Yotsee] ?? 0 > 0) {
                        return (scores[Score.Yotsee] ?? 0) + 1000;
                    }
                    return 500;
                }
                return scores[Score.Yotsee] ?? 0;
            }
            case Score.Chance:
                return (dice.reduce((a, b) => a + b.value, 0) + (valueCountsWithWild[0] * 6)) * multiplier;
            case Score.TopSub: return scores.map((v, i) => (i < Score.ThreeOfKind) ? this.calculateCurrentScore(playerNumber, i) : null).filter(s => s !== null).reduce((a, b) => (a ?? 0) + (b ?? 0), 0);
            case Score.Bonus: return (this.calculateCurrentScore(playerNumber, Score.TopSub) ?? 0) >= 63 ? 35 : 0;
            case Score.TopTotal: return (this.calculateCurrentScore(playerNumber, Score.TopSub) ?? 0) + (this.calculateCurrentScore(playerNumber, Score.Bonus) ?? 0);
            case Score.BottomTotal: return scores.map((v, i) => (i > Score.Sixes && i < Score.TopSub) ? this.calculateCurrentScore(playerNumber, i) : null).filter(s => s !== null).reduce((a, b) => (a ?? 0) + (b ?? 0), 0);
            case Score.GrandTotal: return (this.calculateCurrentScore(playerNumber, Score.TopTotal) ?? 0) + (this.calculateCurrentScore(playerNumber, Score.BottomTotal) ?? 0);
        }
        return 0;
    }

    render() {
        return (
            <div className="Board">
                <div className="Board-Header">
                    <img className="Board-Header-Icon" src={icon} alt="icon" />
                Yotsee
                </div>
                <div className="Board-Menu">
                </div>
                <div className="Board-Menu-Divider" />
                <div className="Board-Main">
                    <div className="Board-Main-Top-Row">
                        <div
                            className={`Board-Roll-Button ${this.state.isButtonDown ? "Board-Roll-Button-Down" : "Board-Roll-Button-Up"}`}
                            onMouseDown={() => this.setState({isButtonDown: true})}
                            onMouseUp={() =>
                                this.state.isRolling ?
                                    this.stopRolling() :
                                        this.isScoring() ?
                                            this.endTurn() :
                                            this.startRolling()
                            }
                            onMouseOut={() => this.setState({isButtonDown: false})}
                        >
                            <div className="Board-Roll-Button-Text">
                                {this.state.isRolling ? "End Roll" :
                                    this.isScoring() ? "End Turn" : "Begin Roll"}
                            </div>
                        </div>
                        <div className="Board-Score-Header">
                            <div className="Board-Score-Header-Rolls">Rolls left: <div>{3 - this.state.rollsComplete}</div></div>
                            <div className={`Board-Score-Header-Player Player-${this.state.currentPlayer}`}><div>{this.state.currentPlayer + 1}</div></div>
                        </div>
                    </div>
                    <div className="Board-Main-Bottom-Row">
                        <div className="Board-Dice-Tray">
                            {this.state.dice.map((die, i) =>
                                <div 
                                    className={`Board-Die ${die.isLocked ? "Board-Die-Locked" : "Board-Die-Unlocked"}`}
                                    onClick={() => this.toggleDieLock(i)}
                                    key={`die-${i}`}
                                >
                                    <img 
                                        className="Board-Die-Image"
                                        alt="Die"
                                        src={this.dieImages[die.value]}
                                        draggable={false}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="Board-Score-Card">
                            <div>
                                <table className="Board-Score-Card-Top">
                                    <tbody>
                                        {this.boardRow("Aces", Score.Aces, "ADD ACES ONLY")}
                                        {this.boardRow("Twos", Score.Twos, "ADD TWOS ONLY")}
                                        {this.boardRow("Threes", Score.Threes, "ADD THREES ONLY")}
                                        {this.boardRow("Fours", Score.Fours, "ADD FOURS ONLY")}
                                        {this.boardRow("Fives", Score.Fives, "ADD FIVES ONLY")}
                                        {this.boardRow("Sixes", Score.Sixes, "ADD SIXES ONLY")}
                                        {this.boardRow("Top Sub Total", Score.TopSub)}
                                        {this.boardRow("Bonus", Score.Bonus, "SCORE 35 IF TOP SUBTOTAL >= 63")}
                                        {this.boardRow("Top Total", Score.TopTotal)}
                                    </tbody>
                                </table>
                                <div className="Board-Score-Card-Right-Line"></div>
                            </div>
                            <div className="Board-Score-Card-Bottom-Line"></div>
                            <div>
                                <table className="Board-Score-Card-Middle">
                                    <tbody>
                                        {this.boardRow("3 of a Kind", Score.ThreeOfKind, "ADD TOTAL OF DICE")}
                                        {this.boardRow("4 of a Kind", Score.FourOfKind, "ADD TOTAL OF DICE")}
                                        {this.boardRow("Full House", Score.FullHouse, "SCORE 25")}
                                        {this.boardRow("Small Straight", Score.SmallStraight, "SCORE 30")}
                                        {this.boardRow("Large Straight", Score.LargeStraight, "SCORE 40")}
                                        {this.boardRowYotsee()}
                                        {this.boardRow("Chance", Score.Chance, "ADD TOTAL OF DICE")}
                                        {this.boardRow("Bottom Total", Score.BottomTotal)}
                                        {this.boardRow("Top Total", Score.TopTotal)}
                                    </tbody>
                                </table>
                                <div className="Board-Score-Card-Right-Line"></div>
                            </div>
                            <div className="Board-Score-Card-Bottom-Line"></div>
                            <div>
                                <table className="Board-Score-Card-Bottom">
                                    <tbody>
                                        {this.boardRow("Grand Total", Score.GrandTotal)}
                                    </tbody>
                                </table>
                                <div className="Board-Score-Card-Right-Line"></div>
                            </div>
                            <div className="Board-Score-Card-Bottom-Line"></div>
                        </div>
                        <div className="Board-Score-Tray">
                            <div className="Board-Player-List"></div>
                            <div className="Board-Player-Summary"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    isScoring = () =>
        this.state.rollsComplete === 3 || 
        this.state.dice.filter(die => die.isLocked).length === 5;

    startRolling() {
        console.log("startRolling()");

        this.playSound("rolling");

        this.setState({
            isButtonDown: false,
            isRolling: true,
        });

        setTimeout(this.rollem.bind(this), this.timeoutMs);
    }

    stopRolling() {
        console.log("stopRolling()");

        this.sounds["rolling"].pause();
        this.sounds["rolling"].currentTime = 0;

        const rollsComplete = this.state.rollsComplete + 1;

        const unlockedCount = this.state.dice.filter(die => !die.isLocked).length;

        const max = Math.max.apply(Math, this.state.dice.filter(die => die.value !== 0).map(die => die.value));
        const min = Math.min.apply(Math, this.state.dice.filter(die => die.value !== 0).map(die => die.value));

        if (max === min) {
            this.playSound("yotsee");
        } else if (this.state.dice.filter(die => die.value === 0 && !die.isLocked).length) {
            this.playSound("wild");
        } else {
            this.playEndRoll(unlockedCount);
        }

        this.setState({
            isButtonDown: false,
            isRolling: false,
            rollsComplete: rollsComplete,
        }, () => {
            if (rollsComplete === 3) {
                this.setAllDiceTo(true);
            }
        });
    }

    endTurn() {
        console.log("endTurn()");

        this.playSound("score");

        const { scoreSelectionPosition, currentPlayer, players } = this.state;
        const { scores } = players[currentPlayer];

        if ((scores[Score.Yotsee] ?? 0 > 0) && scoreSelectionPosition == Score.Yotsee) {
            players[currentPlayer].yosteeBonus++;
        }
        scores[scoreSelectionPosition] = this.calculateCurrentScore(currentPlayer, scoreSelectionPosition);

        this.setState({
            players: players,
            currentPlayer: currentPlayer === players.length - 1 ? 0 : currentPlayer + 1,
            isButtonDown: false,
            rollsComplete: 0,
            scoreSelectionPosition: this.getNextScoreSelectionPosition(-1, 1),
        });

        this.setAllDiceTo(false);
    }

    setAllDiceTo(locked: boolean) {
        console.log(`setAllDiceTo(locked: ${locked})`);
        this.state.dice.forEach((die, i) => {
            if (die.isLocked !== locked) {
                this.setDieTo(i, locked);
            }
        });
    }

    setDieTo = (i: number, locked: boolean) => {
        console.log(`setDieTo(i: ${i}, locked: ${locked})`);

        const dice = this.state.dice.map((die: Die, j: number) => {
            if (j === i) {
                die.isLocked = locked;
                return die;
            } else {
                return die;
            }
        });

        this.setState({ dice });
    }

    toggleDieLock = (i: number) => {
        console.log(`toggleDieLock(i: ${i})`);

        // User can't toggle dice...  
        if (this.state.isRolling || // while rolling,
            this.state.rollsComplete === 0 || // at the beginning of the turn,
            this.state.rollsComplete === 3 // or at the end of the turn
        ) {
            return;
        }

        this.playSound(this.state.dice[i].isLocked ? "unlock" : "lock");
        this.setDieTo(i, !this.state.dice[i].isLocked);
    }

    rollem = () => {
        if (!this.state.isRolling) {
            return;
        }

        const dice = this.state.dice.map((die: Die, j: number) => {
            if (!die.isLocked) {
                die.value = this.rollDie();
            }
            return die;
        });

        this.setState({ dice });

        if (this.state.isRolling) {
            setTimeout(this.rollem.bind(this), this.timeoutMs);
        }
    }

    rollDie = () => {
        let roll = Math.floor(Math.random() * 121);
        if(roll === 0) {
            return 0;
        }
        return Math.floor((roll - 1) / 20) + 1;
    }

    playEndRoll = (die: number) => {
        console.log(`playSound: endroll${die}`);
        this.sounds[`endroll${die}`].play();
    }

    playSound = (sound: "click" | "endgame" | "lock" | "mad" | "rollem" | "rolling" | "score" | "ugotit" | "unlock" | "wild" | "yotsee") => {
        console.log(`playSound: ${sound}`);
        if (!this.sounds[sound].paused) {
            this.sounds[sound].pause();
            this.sounds[sound].currentTime = 0;
        }
        this.sounds[sound].play();
    }

    getNextScoreSelectionPosition = (fromPosition: number, direction: -1 | 1): number => {
        const { currentPlayer, players } = this.state;
        const { scores, yosteeBonus } = players[currentPlayer];

        const possibleYotseeScore = this.calculateCurrentScore(currentPlayer, Score.Yotsee) ?? 0;
        const currentYotseeScore = scores[Score.Yotsee] ?? 0;
        const canScoreYotseeBonus = yosteeBonus < 3 && possibleYotseeScore > currentYotseeScore;

        let remainingScoreIndexes = scores
            .map((v, i) => (v === undefined || (i === Score.Yotsee && canScoreYotseeBonus)) ? i : undefined)
            .map(i => i as number);

        if (direction === -1) {
            remainingScoreIndexes = remainingScoreIndexes.reverse();
        }

        let filteredIndexes = remainingScoreIndexes
            .map(v => {
                const result = (direction === 1 ? (v > fromPosition) : (v < fromPosition)) && v !== undefined ? v : undefined;
                return result;
            });

        let nextSelectionPosition = filteredIndexes.filter(i => i !== undefined)[0];

        if (nextSelectionPosition === undefined) {
            nextSelectionPosition = this.getNextScoreSelectionPosition(direction === 1 ? -1 : Score.TopSub, direction) as number;
        }

        return nextSelectionPosition as number
    }
}
