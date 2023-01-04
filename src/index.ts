import { Context, Hono } from 'hono'
import { Environment } from 'hono/dist/types/types'

const app = new Hono()

interface Card {
  id: number;
  content: string;
}

let dbCards: Card[] = [];

const existsCard = (id: number) => dbCards.some(c => c.id === id)
const findCard = (id: number) => dbCards.find(c => c.id === id)
const parseId = (idRaw: string) => parseInt(idRaw)

const postCard = async (c: Context<"id", Environment, unknown>) => {
  const id = parseId(c.req.param('id'))

  // recover headers
  const headers = c.req.header('Content-Type')

  // default body content
  let body = {
    content: 'Default content'
  }

  if (headers === "application/json") {
    body = await c.req.json()
  }

  const card: Card = {
    content: body.content ?? 'Default content',
    id: Number(id)
  }

  if (existsCard(card.id)) {
    c.status(409)
    return c.body('That card already exists')
  }


  // add card
  dbCards.push(card)

  return c.json({
    ...card
  })
}

const deleteCard = async (c: Context<"id", Environment, unknown>) => {
  const id = parseInt(c.req.param('id'))


  if (!id) {
    c.status(400)
    return c.body('Invalid id')
  }

  // No exists card
  if (!existsCard(id)) {
    c.status(404)

    return c.json({
      error: 'Card no exists'

    })
  }

  const cardToDelete = findCard(id);

  dbCards = dbCards.filter(c => c.id !== cardToDelete?.id)

  c.status(202)

  return c.body(`Card with id: ${id} Succesfully Deleted`)
}


const updateCard = async (c: Context<"id", Environment, unknown>) => {

  const id = parseInt(c.req.param('id'))
  if (!id) {
    c.status(400)
    return c.body('Invalid id')
  }

  if (!existsCard(id)) {
    const body: Card = await c.req.json()
    const newCard: Card = {
      id,
      content: body.content
    }

    dbCards.push(newCard)

    c.status(201)
    return c.body(`Card with id: ${id} created`)
  }
  let body: { content: string };
  body = await c.req.json()
  // No exists card
  if (body.content === undefined) {
    c.status(400)
    return c.body('Need to add content in body')
  }

  let filteredCards = dbCards.filter(c => c.id !== id)

  const newCard: Card = {
    id,
    content: body.content
  }

  dbCards = [...filteredCards, newCard]

  return c.text(`Card with id: ${id} updated`)

}

app.get('/', (c) => c.json({
  msg: 'Hello Hono! 🐢',
  cards: dbCards
}))

app.post('/card/:id', async (c) => {
  try {
    const resp = await postCard(c)

    return resp
  } catch (err) {
    c.status(500)

    return c.body(JSON.stringify(err))
  }
})

app.put('/card/:id', async (c) => {
  try {
    const resp = await updateCard(c)

    return resp
  } catch (err) {
    c.status(500)

    return c.body(JSON.stringify(err))
  }
})

app.delete('/card/:id', async (c) => {
  try {
    const resp = await deleteCard(c)

    return resp
  } catch (err) {
    c.status(500)

    return c.body(JSON.stringify(err))
  }
})


export default app