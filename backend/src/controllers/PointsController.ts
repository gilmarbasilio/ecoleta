import { Request, Response } from "express";
import knex from '../database/connection';

class PointsController {
  static async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

      const points = await knex('points')
        .join('points_items', 'points.id', '=', 'points_items.point_id')
        .whereIn('points_items.item_id', parsedItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*')

        return response.json(points);
  }

  static async show(request: Request, response: Response) {
    const { id } = request.params; 

    const point = await knex('points').where('id', id).first();

    if(!point) {
      return response.status(400).json({
        message: 'Point not found.'
      })
    }

    const items = await knex('items')
      .join('points_items', 'items.id', '=', 'points_items.item_id')
      .where('points_items.point_id', id)
      .select('items.title');

    return response.json({ point, items });
  }
  
  static async create(request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items
    } = request.body;
    
    const trx = await knex.transaction();

    const point = {
      image: 'https://images.unsplash.com/photo-1584680226833-0d680d0a0794?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=60',
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    }
  
    const insertedIds = await trx('points').returning('id').insert(point);
  
    const point_id = insertedIds[0];
  
    const pointItems = items.map((item_id: number)=> {
      return {
        item_id,
        point_id
      };
    });
  
    await trx('points_items').insert(pointItems);
  
    trx.commit();

    return response.json({
      id: point_id,
      ...point
    });
  }
}

export default PointsController;