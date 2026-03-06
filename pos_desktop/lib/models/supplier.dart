class Supplier {
  final String id;
  final String name;
  final String contactName;
  final String email;
  final String phone;
  final String address;

  Supplier({
    required this.id,
    required this.name,
    this.contactName = '',
    this.email = '',
    this.phone = '',
    this.address = '',
  });

  factory Supplier.fromJson(Map<String, dynamic> json) {
    return Supplier(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown',
      contactName: json['contact_person']?.toString() ?? json['contactName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'contact_person': contactName,
    'email': email,
    'phone': phone,
    'address': address,
  };
}
