import { LaptopModel, ILaptop } from "../models/laptop.model";
import { LaptopQueryDTO } from "../dtos/laptop.dto";

export interface ILaptopRepository {
  createLaptop(data: Partial<ILaptop>): Promise<ILaptop>;
  getLaptopById(id: string): Promise<ILaptop | null>;
  getAllLaptops(
    query: LaptopQueryDTO,
  ): Promise<{ laptops: ILaptop[]; total: number }>;
  getLaptopsBySeller(sellerId: string): Promise<ILaptop[]>;
  updateLaptop(id: string, data: Partial<ILaptop>): Promise<ILaptop | null>;
  deleteLaptop(id: string): Promise<boolean>;
}

export class LaptopRepository implements ILaptopRepository {
  async createLaptop(data: Partial<ILaptop>): Promise<ILaptop> {
    const laptop = new LaptopModel(data);
    return await laptop.save();
  }

  async getLaptopById(id: string): Promise<ILaptop | null> {
    return await LaptopModel.findById(id).populate(
      "sellerId",
      "fullName phoneNumber imageUrl",
    );
  }

  async getAllLaptops(
    query: LaptopQueryDTO,
  ): Promise<{ laptops: ILaptop[]; total: number }> {
    const {
      page,
      size,
      search,
      brand,
      condition,
      status,
      minPrice,
      maxPrice,
      minRam,
      storageType,
      sortBy,
    } = query;

    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { modelName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (brand) filter.brand = { $regex: brand, $options: "i" };
    if (condition) filter.condition = condition;
    if (status) filter.status = status;
    if (storageType) filter.storageType = storageType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = minPrice;
      if (maxPrice) filter.price.$lte = maxPrice;
    }
    if (minRam) filter.ram = { $gte: minRam };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };
    const sort = sortMap[sortBy] ?? { createdAt: -1 };

    const [laptops, total] = await Promise.all([
      LaptopModel.find(filter)
        .populate("sellerId", "fullName phoneNumber imageUrl")
        .sort(sort)
        .skip((page - 1) * size)
        .limit(size),
      LaptopModel.countDocuments(filter),
    ]);

    return { laptops, total };
  }

  async getLaptopsBySeller(sellerId: string): Promise<ILaptop[]> {
    // Use $expr with $toString to handle both ObjectId and string sellerId types
    return await LaptopModel.find({
      $expr: {
        $eq: [{ $toString: "$sellerId" }, sellerId],
      },
    })
      .populate("sellerId", "fullName phoneNumber imageUrl")
      .sort({ createdAt: -1 });
  }

  async updateLaptop(
    id: string,
    data: Partial<ILaptop>,
  ): Promise<ILaptop | null> {
    return await LaptopModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteLaptop(id: string): Promise<boolean> {
    const result = await LaptopModel.findByIdAndDelete(id);
    return result ? true : false;
  }
}
