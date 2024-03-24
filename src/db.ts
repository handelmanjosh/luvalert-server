


export async function get_mongodb<T>(construct: any, params: any): Promise<T | null> {
    try {
        const d = await construct.findOne(params)
        if (d) {
            return d as T;
        } else {
            return null;
        }
    } catch (e) {
        console.error(e);
        return null;
    }
}
export async function create_mongodb<T>(construct: any, data: any): Promise<T | null> {
    try {
        const n = await new construct(data);
        await n.save();
        return n as T;
    } catch (e) {
        console.error(e);
        return null
    }
}

export async function update(construct: any, find: any, data: any): Promise<boolean> {
    try {
        await construct.findOneAndUpdate(find, data, { new: true });
    } catch (e) {
        console.error(e);
        return false;
    }
}