/*
 * Copyright 2002-2013 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.springframework.samples.petclinic.service.userService;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.startsWith;
import static org.hamcrest.MatcherAssert.assertThat;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.Locale;

import javax.sql.DataSource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.samples.petclinic.model.User;
import org.springframework.samples.petclinic.service.UserService;

public abstract class AbstractUserServiceTests {

    @Autowired
    private UserService userService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @BeforeEach
    public void init() {
        // Remove o usuário de teste caso ele já exista no banco (ex.: MySQL persistente)
        deleteUserIfExists("username");
    }


    @Test
    public void shouldAddUser() throws Exception {
        User user = new User();
        user.setUsername("username");
        user.setPassword("password");
        user.setEnabled(true);
        user.addRole("OWNER_ADMIN");

        userService.saveUser(user);

        // Verifica se todos os roles começam com "ROLE_" e se a relação bidirecional está populada
        assertThat(
            user.getRoles().parallelStream().allMatch(role -> role.getName().startsWith("ROLE_")),
            is(true)
        );
        assertThat(
            user.getRoles().parallelStream().allMatch(role -> role.getUser() != null),
            is(true)
        );
    }


    /**
     * Remove o usuário do banco se existir. Apaga primeiro tabelas-filhas para evitar FK.
     * Ajusta dinamicamente conforme a existência das tabelas (roles/authorities).
     */
    private void deleteUserIfExists(String username) {
        // Tabela padrão do seu mapeamento: users (PK: username)
        // Primeiro remove dependências (roles/authorities), se existirem.
        if (tableExists("roles")) {
            // Cenário comum: tabela roles com FK para users.username (coluna "username")
            // Se seu schema usar outro nome de coluna, ajuste aqui.
            jdbcTemplate.update("DELETE FROM roles WHERE username = ?", username);
        }

        // Alguns projetos Spring Security usam "authorities" em vez de "roles"
        if (tableExists("authorities")) {
            jdbcTemplate.update("DELETE FROM authorities WHERE username = ?", username);
        }

        // Por fim, remove o usuário (se existir, delete afetará 1 linha; se não, 0 linhas e segue)
        jdbcTemplate.update("DELETE FROM users WHERE username = ?", username);
    }

    /**
     * Verifica se uma tabela existe no schema atual, compatível com HSQLDB (uppercase)
     * e bancos como MySQL (case-insensitive dependendo da config).
     */
    private boolean tableExists(String tableName) {
        String tn = tableName.toLowerCase(Locale.ROOT);
        String tu = tableName.toUpperCase(Locale.ROOT);

        try (Connection con = dataSource.getConnection()) {
            DatabaseMetaData meta = con.getMetaData();

            // tenta lowercase
            if (exists(meta, tn)) return true;
            // tenta uppercase (HSQLDB costuma registrar em uppercase)
            if (exists(meta, tu)) return true;

            // fallback: busca sem depender do case
            try (ResultSet rs = meta.getTables(con.getCatalog(), null, "%", new String[] { "TABLE" })) {
                while (rs.next()) {
                    String found = rs.getString("TABLE_NAME");
                    if (found != null && found.equalsIgnoreCase(tableName)) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {
            // Se falhar por qualquer motivo, assume que não existe para não quebrar o teste
        }
        return false;
    }

    private boolean exists(DatabaseMetaData meta, String exactName) {
        try (ResultSet rs = meta.getTables(null, null, exactName, new String[] { "TABLE" })) {
            return rs.next();
        } catch (Exception e) {
            return false;
        }
    }


}
