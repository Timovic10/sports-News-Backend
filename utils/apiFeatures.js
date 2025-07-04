export class ApiFeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose query
    this.queryString = queryString; // req.query
  }

  search(fields = []) {
    if (this.queryString.search) {
      const regex = new RegExp(this.queryString.search, "i");
      const searchConditions = fields.map((field) => ({
        [field]: regex,
      }));
      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }

  sort() {
    if (this.queryString.sortBy) {
      const sortBy = this.queryString.sortBy;
      const order = this.queryString.order === "desc" ? -1 : 1;
      this.query = this.query.sort({ [sortBy]: order });
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
