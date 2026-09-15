import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('CampusFriend'),
        actions: [
          IconButton(
            onPressed: () {
              auth.logout();
              Navigator.pushReplacementNamed(context, '/');
            },
            icon: const Icon(Icons.logout),
          )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Campus Feed',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          const Text(
            'Stay connected to campus announcements, communities, and friends.',
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 24),
          _buildCard(
            title: 'Communities',
            subtitle: 'Browse student groups and events',
            icon: Icons.group,
          ),
          const SizedBox(height: 14),
          _buildCard(
            title: 'Messages',
            subtitle: 'Chat with your classmates',
            icon: Icons.message,
          ),
          const SizedBox(height: 14),
          _buildCard(
            title: 'Resources',
            subtitle: 'Find campus guides and helpful links',
            icon: Icons.school,
          ),
          const SizedBox(height: 14),
          _buildCard(
            title: 'Profile',
            subtitle: 'Manage your account and preferences',
            icon: Icons.person,
          ),
        ],
      ),
    );
  }

  Widget _buildCard({
    required String title,
    required String subtitle,
    required IconData icon,
  }) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.indigo.shade100,
          child: Icon(icon, color: Colors.indigo),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {},
      ),
    );
  }
}
