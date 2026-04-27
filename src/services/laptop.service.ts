import { HttpError } from "../errors/http-error";
import {
  CreateLaptopDTO,
  UpdateLaptopDTO,
  LaptopQueryDTO,
} from "../dtos/laptop.dto";
import { LaptopRepository } from "../repositories/laptop.repositories";

const laptopRepository = new LaptopRepository();

export class LaptopService {
  async createLaptop(data: CreateLaptopDTO, sellerId: string) {
    const laptop = await laptopRepository.createLaptop({ ...data, sellerId });
    return laptop;
  }

  async getLaptopById(id: string) {
    const laptop = await laptopRepository.getLaptopById(id);
    if (!laptop) {
      throw new HttpError("Laptop not found", 404);
    }
    return laptop;
  }

  async getAllLaptops(query: LaptopQueryDTO) {
    return await laptopRepository.getAllLaptops(query);
  }

  // Logged in user - their own listings
  async getMyListings(sellerId: string) {
    return await laptopRepository.getLaptopsBySeller(sellerId);
  }

  // Public - anyone can view a seller's listings by sellerId
  async getSellerListings(sellerId: string) {
    const laptops = await laptopRepository.getLaptopsBySeller(sellerId);
    if (!laptops.length) {
      throw new HttpError("No listings found for this seller", 404);
    }
    return laptops;
  }

  async updateLaptop(
    id: string,
    data: UpdateLaptopDTO,
    requesterId: string,
    requesterRole: string,
  ) {
    const laptop = await laptopRepository.getLaptopById(id);
    if (!laptop) {
      throw new HttpError("Laptop not found", 404);
    }
    // sellerId may be a populated object after populate(), so convert to string
    if (
      laptop.sellerId.toString() !== requesterId &&
      requesterRole !== "admin"
    ) {
      throw new HttpError("Unauthorized", 403);
    }
    const updated = await laptopRepository.updateLaptop(id, data as any);
    return updated;
  }

  async deleteLaptop(id: string, requesterId: string, requesterRole: string) {
    const laptop = await laptopRepository.getLaptopById(id);
    if (!laptop) {
      throw new HttpError("Laptop not found", 404);
    }
    // sellerId may be a populated object after populate(), so convert to string
    if (
      laptop.sellerId.toString() !== requesterId &&
      requesterRole !== "admin"
    ) {
      throw new HttpError("Unauthorized", 403);
    }
    const deleted = await laptopRepository.deleteLaptop(id);
    if (!deleted) {
      throw new HttpError("Failed to delete listing", 500);
    }
    return { message: "Laptop listing deleted successfully" };
  }
}
