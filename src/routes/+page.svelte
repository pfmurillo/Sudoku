<script>
    import {
        sudoku,
        generateGrid,
        showRandomCell,
        updateCellInput,
        getRelatedCells,
    } from '$lib/store'
    import { fade } from 'svelte/transition'

    const MAX_HINTS_NBR = 5
    const SHOW_CONFLICTS = true

    let showConflicts = SHOW_CONFLICTS
    let showDialog = false
    let conflicts = []
    let shown = []
    let hints_nbr = 0
    let winner = false

    $: remaining = MAX_HINTS_NBR - hints_nbr
    $: desc_remaining = remaining + ' remaining'

    const newGame = () => {
        showDialog = false
        winner = false
        shown = []
        hints_nbr = 0
        sudoku.update(generateGrid)
    }

    const toggleConflicts = () => {
        showConflicts = !showConflicts
    }

    const showHidden = async () => {
        let hidden = $sudoku.filter(({ id, visible }) => {
            return visible && !shown.includes(id)
        })
        while (hidden.length > 0) {
            let id = await getRandomHidden(hidden)
            shown = [...shown, id]
            let index = hidden.findIndex((h) => h.id === id)
            hidden.splice(index, 1)
        }
    }

    const getRandomHidden = (hidden) => {
        return new Promise((resolve) => {
            let index = Math.floor(Math.random() * hidden.length)
            setTimeout(() => {
                resolve(hidden[index].id)
            }, 120)
        })
    }

    const showHint = () => {
        if (!remaining) {
            desc_remaining = 'Nope, sorry!'
            return
        }
        sudoku.update(showRandomCell)
        hints_nbr++
    }

    const submitCell = (id, input) => {
        updateCellInput(id, input)
    }

    const showResult = async () => {
        await validateGrid()
        showDialog = true
    }

    const validateGrid = async () => {
        let cells = $sudoku.filter(({ visible }) => {
            return !visible
        })
        for (let i = 0; i < cells.length; i++) {
            let valid = await validateCell(cells[i])
            if (!valid) return
        }
        winner = true
    }

    const validateCell = ({ id, value, input }) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                let valid = false
                if (value == input) {
                    valid = true
                }
                resolve(valid)
            }, 50)
        })
    }

    const validInput = (value) => {
        if (!value) return true
        value = parseInt(value)
        if (value >= 0 && value <= 9) {
            return true
        }
        return false
    }

    $: {
        showHidden()

        let updatedConflicts = []

        // only evaluates cells with a valid user input
        let evaluated = $sudoku.filter(({ input }) => {
            return input && validInput(input)
        })

        evaluated.forEach(({ id, input }) => {
            let relatedCells = getRelatedCells(id)
            relatedCells.forEach((relatedId) => {
                let relatedCell = $sudoku[relatedId]
                let relatedVal = relatedCell.visible
                    ? relatedCell.value
                    : relatedCell.input
                if (relatedVal == input) {
                    if (!updatedConflicts.includes(id)) {
                        updatedConflicts.push(id)
                    }
                    if (!updatedConflicts.includes(relatedCell.id)) {
                        updatedConflicts.push(relatedCell.id)
                    }
                }
            })
        })
        conflicts = updatedConflicts
    }
</script>

<h1>Yet Another Sudoku Game</h1>

{#if $sudoku.length === 81}
    <div id="container">
        <div>
            <div id="sudoku">
                {#each $sudoku as { id, value, visible, input }}
                    <div
                        class="cell"
                        class:error={showConflicts &&
                            (conflicts.includes(id) || !validInput(input))}
                    >
                        {#if visible && shown.includes(id)}
                            <span>{value}</span>
                        {:else}
                            <input
                                type="text"
                                maxlength="1"
                                {id}
                                on:change={() => submitCell(id, input)}
                                bind:value={input}
                                disabled={visible}
                            />
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
        <div id="buttons">
            <button on:click={showResult} class="validate">Validate Grid</button
            >
            <button on:click={showHint} class="hint"
                >Show Hint ({desc_remaining})</button
            >
            <button
                on:click={toggleConflicts}
                class="mistakes"
                class:activated={showConflicts}>Show Mistakes</button
            >
            <button on:click={newGame} class="start">Generate New Grid</button>
        </div>
    </div>
{:else}
    <div id="disclaimer">
        <p>
            The rules for Sudoku are simple. A 9×9 square must be filled in with
            numbers from 1-9 with no repeated numbers in each line, horizontally
            or vertically. To challenge you more, there are 3×3 squares marked
            out in the grid, and each of these squares can't have any repeat
            numbers either.
        </p>
        <button on:click={newGame} class="validate">Start Game</button>
    </div>
{/if}

{#if showDialog}
    <div id="dialog" transition:fade={{ duration: 80 }}>
        <div>
            <span class="result">
                {#if winner}
                    Congratulations 🎉
                {:else}
                    Sorry, you lost 😫
                {/if}
            </span>
            <button class="validate" on:click={newGame}>New Game</button>
        </div>
    </div>
{/if}

<footer>
    made with ❤️ and Svelte by <a href="https://pfmurillo.github.io/"
        >pfmurillo</a
    >
</footer>

<style>
    #dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #40404070;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    #dialog > div {
        padding: 48px;
        border-radius: 8px;
        background-color: white;
        font-family: var(--fontfamily);
        font-size: 1.8rem;
        color: var(--fontcolor);
    }
    #dialog button.validate {
        display: block;
        margin: 24px auto 0px auto;
    }
    :root {
        --fontcolor: rgb(20, 75, 100);
        --fontsize: 1.6rem;
        --fontfamily: 'Gill Sans', sans-serif;
    }
    h1 {
        width: fit-content;
        margin: 36px auto;
        color: var(--fontcolor);
        font-family: var(--fontfamily);
        font-weight: 500;
        font-size: 2.5rem;
    }
    p {
        font-family: var(--fontfamily);
        font-size: 1.4rem;
        font-weight: 300;
        line-height: 48px;
    }
    #disclaimer {
        padding: 48px;
    }
    #disclaimer > p {
        display: block;
        margin: auto;
        margin-bottom: 48px;
        max-width: 680px;
    }
    #disclaimer > button {
        display: block;
        margin: auto;
    }
    #container {
        display: flex;
        flex-direction: row;
        width: fit-content;
        margin: auto;
        gap: 48px;
        padding: 48px 12px;
    }
    #container > div:first-of-type {
        width: fit-content;
    }
    #container > div:last-of-type {
        text-align: left;
        width: fit-content;
        min-width: 268px;
    }
    @media (max-width: 880px) {
        #container {
            flex-direction: column;
        }
    }
    #actions {
        text-align: center;
    }
    button {
        white-space: nowrap;
        display: block;
        padding: 6px 18px;
        margin: 0px 0px 24px 0px;
        cursor: pointer;
        color: var(--fontcolor);
        border: 2px solid antiquewhite;
        border-radius: 4px;
        font-size: 1.2rem;
        font-weight: 500;
        transition: all 400ms;
        background-color: antiquewhite;
    }
    button.validate {
        background-color: yellowgreen;
        border-color: yellowgreen;
        color: white;
    }
    button.validate:hover {
        background-color: green;
        border-color: green;
        color: white;
    }
    button.start {
        border-color: yellowgreen;
    }
    button.start:hover {
        border-color: green;
    }
    button.mistakes {
        border-color: pink;
    }
    button.mistakes:hover {
        border-color: rgb(153, 86, 97);
    }
    button.mistakes.activated {
        border-color: red;
        background-color: red;
        color: white;
    }
    button.hint {
        border-color: orange;
    }
    button.hint:hover {
        border-color: orangered;
    }
    #sudoku {
        width: 100%;
        max-width: 580px;
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        gap: 8px;
        font-size: var(--fontsize);
        font-family: var(--fontfamily);
        color: var(--fontcolor);
        box-sizing: border-box;
    }
    #sudoku > .cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0px;
        border: 0px;
    }
    #sudoku > .cell > input {
        display: flex;
        margin: 0;
        padding: 0;
        width: 100%;
        border-radius: 4px;
        aspect-ratio: 1;
        text-align: center;
        font-size: var(--fontsize);
        font-family: var(--fontfamily);
        color: var(--fontcolor);
        border: 2px solid #efefef;
        outline: none;
    }
    #sudoku > .cell > input:focus {
        border-color: rgb(20, 75, 100);
    }
    #sudoku > .cell.error,
    #sudoku > .cell.error > input {
        background-color: rgb(255, 211, 218);
        animation: popError 800ms 1;
    }
    #sudoku > .cell.error > input {
        border-color: red;
    }
    #sudoku > .cell > span {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        aspect-ratio: 1;
        animation: popHint 2200ms 1;
        border-radius: 4px;
    }
    @keyframes popError {
        from {
            background-color: red;
        }
        to {
            background-color: rgb(255, 211, 218);
        }
    }
    @keyframes popHint {
        from {
            background-color: yellowgreen;
        }
        to {
            background-color: transparent;
        }
    }
    footer {
        padding: 20px;
        color: var(--fontcolor);
        text-align: center;
        font-family: var(--fontfamily);
        margin-top: 48px;
        font-size: 1.4rem;
    }
    footer a {
        color: var(--fontcolor);
    }
</style>
