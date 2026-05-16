import { pgTable, serial, text, doublePrecision, integer } from 'drizzle-orm/pg-core'

export const restaurants = pgTable('restaurants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  genre: text('genre').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  placeId: text('place_id').notNull(),
  rating: integer('rating').notNull(), // 1〜5
  memo: text('memo').notNull(),
})

export const restaurantPhotos = pgTable('restaurant_photos', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),

  restaurantId: integer('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
})
