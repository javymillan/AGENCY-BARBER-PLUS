import { supabase } from './supabase';

export async function loginAdmin(username: string, password: string) {
  try {
    console.log('Intentando iniciar sesión como administrador:', username);
    
    // Para AGENCY BARBER PLUS, usamos un sistema de credenciales unificado
    if (username === 'admin' && password === 'admin123') {
      // Intentamos obtener el usuario de la base de datos vía RPC
      const { data, error } = await supabase.rpc('get_admin_user', { admin_username: 'admin' });
      
      if (error) {
        console.warn('Error al obtener usuario admin mediante RPC (posiblemente falta la función):', error);
        
        // Fallback: Si no existe la función RPC, permitimos el acceso con las credenciales
        // pero simulamos el objeto de usuario. En producción esto debería estar blindado.
        return {
          id: '00000000-0000-0000-0000-000000000000',
          username: 'admin',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
      }
      
      return data || {
        id: '00000000-0000-0000-0000-000000000000',
        username: 'admin',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
    } else {
      throw new Error('Credenciales incorrectas');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}
