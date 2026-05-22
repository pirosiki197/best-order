import { relations } from 'drizzle-orm'
import { pgTable, serial, text, doublePrecision, integer, unique } from 'drizzle-orm/pg-core'

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

export const restaurantPhotos = pgTable(
  'restaurant_photos',
  {
    id: serial('id').primaryKey(),
    filename: text('filename').notNull(),
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [unique('unique_order_per_restaurant').on(table.restaurantId, table.sortOrder)],
)

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  photos: many(restaurantPhotos),
}))

export const photosRelations = relations(restaurantPhotos, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantPhotos.restaurantId],
    references: [restaurants.id],
  }),
}))
