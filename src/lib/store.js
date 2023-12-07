import { writable } from 'svelte/store'

let sudoku = writable([])

// defines sudoku's total nbr of cells
const cellsNbr = 81
const rowsNbr = Math.sqrt(cellsNbr)
const columnsNbr = Math.sqrt(cellsNbr)
const regionsNbr = Math.sqrt(Math.sqrt(cellsNbr))
let grid
let remainingCells
let availableNbrsByRow
let availableNbrsByColumn
let availableNbrsByRegion

function init() {
    availableNbrsByRow = []
    for (let i = 0; i < rowsNbr; i++) {
        availableNbrsByRow.push([1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
    availableNbrsByColumn = []
    for (let i = 0; i < columnsNbr; i++) {
        availableNbrsByColumn.push([1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
    availableNbrsByRegion = []
    for (let i = 0; i < columnsNbr; i++) {
        availableNbrsByRegion.push([1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
    grid = []
    for (let i = 0; i < cellsNbr; i++) {
        grid.push({
            id: i,
            value: null,
            visible: false,
            input: null,
            hint: false,
        })
    }
    getRemainingCells()
}

const showRandomCell = () => {
    // randomly pick a hidden cell
    let hiddenCells = grid.filter(({ visible }) => {
        return visible === false
    })
    if (hiddenCells.length > 0) {
        let randomIndex = Math.floor(Math.random() * hiddenCells.length)
        grid[hiddenCells[randomIndex].id].input = null
        grid[hiddenCells[randomIndex].id].visible = true
        grid[hiddenCells[randomIndex].id].hint = true
    }
    return grid
}

const showInitialCells = () => {
    for (let i = 0; i < 32; i++) {
        showRandomCell()
    }
}

// get a given cell's row id
function getRowId(cellId) {
    return Math.ceil(((cellId + 1) / cellsNbr) * rowsNbr) - 1
}

// get the column id of a given cell
const getColumnId = (cellId) => {
    return cellId % columnsNbr
}

// get a given cell's region id
const getRegionId = (cellId) => {
    return (
        Math.floor(getRowId(cellId) / regionsNbr) * regionsNbr +
        Math.floor(getColumnId(cellId) / regionsNbr)
    )
}

const getRemainingCells = () => {
    remainingCells = grid.filter((cell) => {
        return cell.value === null
    })
}

const getAvailableNbrs = (id) => {
    let availableNbrs = availableNbrsByRow[getRowId(id)]
    availableNbrs = availableNbrs.filter((nbr) => {
        return availableNbrsByColumn[getColumnId(id)].includes(nbr)
    })
    availableNbrs = availableNbrs.filter((nbr) => {
        return availableNbrsByRegion[getRegionId(id)].includes(nbr)
    })
    return availableNbrs
}

const updateCellInput = (id, input) => {
    grid[id].input = input
    return grid
}

const getRelatedCells = (id) => {
    let cells = []

    let rowId = getRowId(id)
    for (let i = 0; i < 9; i++) {
        let index = rowId * 9 + i
        if (index != id) {
            cells.push(index)
        }
    }

    let columnId = getColumnId(id)
    for (let i = 0; i < 9; i++) {
        let index = i * 9 + columnId
        if (index != id) {
            cells.push(index)
        }
    }

    let regionId = getRegionId(id)
    // TO BE REFACTORED
    // find a given region's cells
    let start, pad, factor

    // calculate factor with regionid
    if (regionId < 3) {
        factor = 0
    } else if (regionId < 6) {
        factor = 1
    } else {
        factor = 2
    }

    pad = 3 * 9 * factor
    start = pad + (regionId - 3 * factor) * 3

    for (let i = 0; i < 9; i++) {
        let j, factor2
        if (i < 3) {
            j = i
            factor2 = 0
        } else if (i < 6) {
            j = i - 3
            factor2 = 1
        } else {
            j = i - 6
            factor2 = 2
        }
        let pad2 = factor2 * 9
        let index = start + pad2 + j

        if (index != id && !cells.includes(index)) {
            cells.push(index)
        }
    }
    return cells
}

const generateGrid = () => {
    init()
    do {
        for (let i = 0; i < remainingCells.length; i++) {
            let id = remainingCells[i].id
            let availableNbrs = getAvailableNbrs(id)
            if (availableNbrs.length === 0) {
                init()
            } else {
                remainingCells[i].possibilities = availableNbrs.length
            }
        }
        // sort remaining cells by remaining numbers
        remainingCells.sort((a, b) => {
            return a.possibilities - b.possibilities
        })
        // get the cell with the fewest possibilities
        let id = remainingCells[0].id
        let availableNbrs = getAvailableNbrs(id)
        // pick a random number amoung available numbers
        let randomIndex = Math.floor(Math.random() * availableNbrs.length)
        let randomNbr = availableNbrs[randomIndex]
        // set the cell a value
        grid[id].value = randomNbr
        // update the list of available numbers for the cell's line, row & region
        availableNbrsByRow[getRowId(id)].splice(
            availableNbrsByRow[getRowId(id)].indexOf(randomNbr),
            1
        )
        availableNbrsByColumn[getColumnId(id)].splice(
            availableNbrsByColumn[getColumnId(id)].indexOf(randomNbr),
            1
        )
        availableNbrsByRegion[getRegionId(id)].splice(
            availableNbrsByRegion[getRegionId(id)].indexOf(randomNbr),
            1
        )
        // update the list of remaining cells
        getRemainingCells()
    } while (remainingCells.length > 0)
    showInitialCells()
    return grid
}

export {
    sudoku,
    generateGrid,
    showRandomCell,
    updateCellInput,
    getRowId,
    getColumnId,
    getRegionId,
    getRelatedCells,
}
